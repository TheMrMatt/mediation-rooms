# Flujo de producto

## Caso de uso: Escrow con mediación

### 1. Depósito
El cliente deposita fondos en `DemoEscrow`. Estado: `DEPOSITED`.

### 2. Entrega
El proveedor marca entrega. Se abre un caso en `MediationRegistry` con ventana de 3 días. Estado: `DELIVERY_MARKED`, caso: `OPEN`.

### 3. Ventana de mediación
Durante la ventana, el cliente puede abrir disputa:
- **Sin disputa** → al expirar, `canExecute = true`, release al proveedor
- **Con disputa** → caso pasa a `DISPUTED`, partes suben evidencia en la web

### 4. Resolución
El agente analiza evidencia y emite outcome:
- `RELEASE_TO_PROVIDER` → contrato libera pago
- `REFUND_TO_CLIENT` → contrato devuelve fondos
- `SPLIT_PAYMENT` → división (futuro)
- `REQUEST_MORE_EVIDENCE` → más tiempo/evidencia
- `MANUAL_REVIEW` → escalamiento humano

### 5. Ejecución
El contrato consulta `canExecute(caseId)` antes de `release()` o `refund()`.

## Estados del caso

| Estado | Descripción |
|--------|-------------|
| `OPEN` | Caso abierto, ventana activa |
| `DISPUTED` | Una parte disputó |
| `RESOLVED` | Agente/mediador resolvió |
| `EXPIRED_NO_DISPUTE` | Ventana expiró sin disputa |
| `CANCELLED` | Caso cancelado |

## Resoluciones

| Resolución | Efecto típico |
|------------|---------------|
| `PENDING` | Sin resolución aún |
| `RELEASE_TO_PROVIDER` | Liberar acción/pago al proveedor |
| `REFUND_TO_CLIENT` | Devolver al cliente |
| `SPLIT_PAYMENT` | Dividir entre partes |
| `REQUEST_MORE_EVIDENCE` | Pedir más evidencia |
| `MANUAL_REVIEW` | Revisión humana |
| `CANCEL_ACTION` | Cancelar acción crítica |
