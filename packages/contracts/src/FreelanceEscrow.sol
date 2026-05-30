// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MediationGuard} from "./MediationGuard.sol";
import {IMediationRegistry} from "./IMediationRegistry.sol";

/**
 * @title FreelanceEscrow
 * @notice Escrow de freelance plug-and-play sobre Mediation Rooms.
 *
 * Flujo:
 *   1. El cliente crea y fondea el contrato con las reglas acordadas.
 *   2. El freelancer entrega el trabajo → abre un caso y arranca la ventana de 48h.
 *   3. Dentro de las 48h:
 *        - el cliente puede aceptar y liberar el pago al instante, o
 *        - cualquiera de las partes puede abrir una disputa, o
 *        - si nadie hace nada, a las 48h se libera automáticamente al freelancer.
 *   4. Si hubo disputa, el agente de Mediation Rooms resuelve on-chain y el
 *      contrato ejecuta el pago según la resolución (liberar / reembolsar / split).
 *
 * Las reglas viven on-chain (auditable) y también se exponen vía evento para que
 * el listener del backend cree la sala de mediación con todo el contexto.
 */
contract FreelanceEscrow is MediationGuard {
    enum Status {
        NONE,
        FUNDED,
        DELIVERED,
        RELEASED,
        REFUNDED,
        SETTLED
    }

    struct Deal {
        bytes32 caseId;
        address client;
        address freelancer;
        uint256 amount;
        Status status;
        uint64 deliveredAt;
        string rules;
        string deliveryUri;
    }

    uint256 public constant ACCEPTANCE_WINDOW = 48 hours;

    mapping(bytes32 => Deal) public deals;
    mapping(bytes32 => bytes32) public caseToDeal;

    event DealCreated(
        bytes32 indexed dealId,
        address indexed client,
        address indexed freelancer,
        uint256 amount,
        string rules
    );
    event WorkDelivered(
        bytes32 indexed dealId,
        bytes32 indexed caseId,
        string deliveryUri,
        uint256 acceptanceDeadline
    );
    event PaymentAccepted(bytes32 indexed dealId, address indexed client, uint256 amount);
    event DisputeOpened(
        bytes32 indexed dealId,
        bytes32 indexed caseId,
        address indexed claimant,
        address respondent,
        string reason
    );
    event Released(bytes32 indexed dealId, address indexed freelancer, uint256 amount);
    event Refunded(bytes32 indexed dealId, address indexed client, uint256 amount);
    event Settled(bytes32 indexed dealId, uint256 toFreelancer, uint256 toClient);

    error InvalidDeal();
    error NotClient();
    error NotFreelancer();
    error NotParty();
    error WrongStatus();
    error WindowNotElapsed();
    error TransferFailed();

    constructor(address registry) MediationGuard(registry) {}

    /// @notice El cliente crea y fondea el trabajo con las reglas acordadas.
    function createAndFund(
        bytes32 dealId,
        address freelancer,
        string calldata rules
    ) external payable {
        if (msg.value == 0 || freelancer == address(0)) revert InvalidDeal();
        if (deals[dealId].status != Status.NONE) revert InvalidDeal();

        deals[dealId] = Deal({
            caseId: bytes32(0),
            client: msg.sender,
            freelancer: freelancer,
            amount: msg.value,
            status: Status.FUNDED,
            deliveredAt: 0,
            rules: rules,
            deliveryUri: ""
        });

        emit DealCreated(dealId, msg.sender, freelancer, msg.value, rules);
    }

    /// @notice El freelancer marca la entrega. Abre el caso y arranca la ventana de 48h.
    function deliverWork(
        bytes32 dealId,
        bytes32 caseId,
        string calldata deliveryUri
    ) external {
        Deal storage deal = deals[dealId];
        if (deal.status != Status.FUNDED) revert WrongStatus();
        if (msg.sender != deal.freelancer) revert NotFreelancer();
        if (caseId == bytes32(0)) revert InvalidDeal();

        deal.status = Status.DELIVERED;
        deal.caseId = caseId;
        deal.deliveredAt = uint64(block.timestamp);
        deal.deliveryUri = deliveryUri;
        caseToDeal[caseId] = dealId;

        uint256 deadline = block.timestamp + ACCEPTANCE_WINDOW;

        IMediationRegistry.ExternalAction memory action = IMediationRegistry.ExternalAction({
            contractAddress: address(this),
            actionId: keccak256(abi.encodePacked("RELEASE", dealId))
        });

        mediationRegistry.openCase(
            caseId,
            deal.client,
            deal.freelancer,
            action,
            deadline
        );

        emit WorkDelivered(dealId, caseId, deliveryUri, deadline);
    }

    /// @notice El cliente aprueba la entrega y libera el pago al instante.
    function accept(bytes32 dealId) external {
        Deal storage deal = deals[dealId];
        if (deal.status != Status.DELIVERED) revert WrongStatus();
        if (msg.sender != deal.client) revert NotClient();

        deal.status = Status.RELEASED;
        uint256 amount = deal.amount;
        deal.amount = 0;

        emit PaymentAccepted(dealId, deal.client, amount);
        _pay(deal.freelancer, amount);
        emit Released(dealId, deal.freelancer, amount);
    }

    /// @notice Cualquiera de las partes abre una disputa dentro de la ventana.
    function openDispute(bytes32 dealId, string calldata reason) external {
        Deal storage deal = deals[dealId];
        if (deal.status != Status.DELIVERED) revert WrongStatus();
        if (deal.caseId == bytes32(0)) revert InvalidDeal();
        if (msg.sender != deal.client && msg.sender != deal.freelancer) revert NotParty();

        // El que abre la disputa es el claimant; la otra parte, el respondent.
        address respondent = msg.sender == deal.client ? deal.freelancer : deal.client;

        mediationRegistry.markDisputed(deal.caseId);

        emit DisputeOpened(dealId, deal.caseId, msg.sender, respondent, reason);
    }

    /// @notice Libera el pago al freelancer (auto a las 48h, o si la resolución lo favorece).
    function release(bytes32 dealId) external {
        Deal storage deal = deals[dealId];
        if (deal.status != Status.DELIVERED) revert WrongStatus();
        if (deal.caseId == bytes32(0)) revert InvalidDeal();

        _requireMediationAllows(deal.caseId);

        IMediationRegistry.Resolution resolution = _getResolution(deal.caseId);
        if (resolution == IMediationRegistry.Resolution.REFUND_TO_CLIENT) {
            revert ActionBlocked(deal.caseId, resolution);
        }
        if (resolution == IMediationRegistry.Resolution.SPLIT_PAYMENT) {
            revert ActionBlocked(deal.caseId, resolution);
        }

        deal.status = Status.RELEASED;
        uint256 amount = deal.amount;
        deal.amount = 0;

        _pay(deal.freelancer, amount);
        emit Released(dealId, deal.freelancer, amount);
    }

    /// @notice Reembolsa al cliente si la resolución lo favorece.
    function refund(bytes32 dealId) external {
        Deal storage deal = deals[dealId];
        if (deal.status != Status.DELIVERED) revert WrongStatus();
        if (deal.caseId == bytes32(0)) revert InvalidDeal();

        IMediationRegistry.Resolution resolution = _getResolution(deal.caseId);
        if (resolution != IMediationRegistry.Resolution.REFUND_TO_CLIENT) {
            revert ActionBlocked(deal.caseId, resolution);
        }

        deal.status = Status.REFUNDED;
        uint256 amount = deal.amount;
        deal.amount = 0;

        _pay(deal.client, amount);
        emit Refunded(dealId, deal.client, amount);
    }

    /// @notice Reparte el pago 50/50 si la resolución es SPLIT_PAYMENT.
    function settleSplit(bytes32 dealId) external {
        Deal storage deal = deals[dealId];
        if (deal.status != Status.DELIVERED) revert WrongStatus();
        if (deal.caseId == bytes32(0)) revert InvalidDeal();

        IMediationRegistry.Resolution resolution = _getResolution(deal.caseId);
        if (resolution != IMediationRegistry.Resolution.SPLIT_PAYMENT) {
            revert ActionBlocked(deal.caseId, resolution);
        }

        deal.status = Status.SETTLED;
        uint256 amount = deal.amount;
        deal.amount = 0;

        uint256 toFreelancer = amount / 2;
        uint256 toClient = amount - toFreelancer;

        _pay(deal.freelancer, toFreelancer);
        _pay(deal.client, toClient);
        emit Settled(dealId, toFreelancer, toClient);
    }

    function getDeal(bytes32 dealId) external view returns (Deal memory) {
        return deals[dealId];
    }

    function _pay(address to, uint256 amount) private {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
