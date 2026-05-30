# Vistas de demo — estructura y UX para rediseñar

> Este documento describe **cómo funcionan hoy** las 3 vistas del flujo de demo de Mediation Rooms, para hacer un refactor **solo visual / UX**.
>
> **No cambiar lógica de producto, API, firmas ni rutas.** Solo presentación y experiencia.
>
> Las 3 vistas son:
> 1. **Sandbox** — elegir y configurar qué caso de demo usar (`/sandbox`)
> 2. **Sala del caso** — leer el reclamo y responder (`/cases/[caseId]`)
> 3. **Resolución** — esperar al agente y ver el veredicto (`/cases/[caseId]/resolution`)
>
> Ya existe un sistema de diseño aplicado en la landing (`apps/web/src/app/globals.css`): paleta cálida (`--background:#F7F4EF`, `--surface:#FFFDF8`), fuente Geist, y clases utilitarias (`.mr-card`, `.mr-btn`, `.mr-badge`, `.mr-chip`, `.mr-grid`, `.mr-timeline`, etc.). **El refactor debe reutilizar ese sistema** para que todo se sienta consistente con la landing.

---

## Contexto del flujo

```
/sandbox  →  (abrir disputa)  →  /cases/[id]  →  (responder)  →  /cases/[id]/resolution
 elegir         POST mock          sala: leer        firma          agente decide
 caso demo                         + responder       en Braga       + cierre
```

- **Persona:** el usuario toma el rol de **respondent** (la parte reclamada, ej. el freelancer).
- **Wallet:** MetaMask en red **Arkiv Braga**. Se conecta desde la barra superior (`AppShell`).
- Las disputas **no se crean desde la web** en producción; el sandbox las simula como lo haría un contrato externo.

---

# VISTA 1 — Sandbox (`/sandbox`)

**Archivos:** `apps/web/src/app/sandbox/page.tsx`, `apps/web/src/components/sandbox-contracts.tsx`

## Qué es

La pantalla donde el usuario **elige un contrato mock** y dispara una disputa para entrar a la sala. Es el punto de entrada del demo.

## Qué muestra hoy

- `PageHeader`: título "Sandbox de contratos" + descripción.
- Un `PlaceholderCard` informativo ("Para qué sirve").
- Una lista de **contract cards** (`ContractCard`), una por cada mock disponible (vienen de `GET /mock/contracts`).

### Cada ContractCard muestra:

| Elemento | Dato / comportamiento |
|---|---|
| Título | `contract.title` |
| Descripción | `contract.description` |
| Reglas del contrato | `contract.rules[]` (lista numerada, solo lectura) |
| Input "Respondent" | address; se autocompleta con la wallet conectada. Editable |
| Hint | Texto según haya wallet conectada o no |
| Reclamo (textarea) | `contract.sampleClaim`, editable |
| Botón | "Abrir disputa y entrar a la sala" |
| Error | Mensaje si falla la API |

## Qué hace al confirmar

Llama `openMockDispute(contractId, { claim, respondentAddress, claimantAddress })` → `POST /mock/contracts/:id/open-dispute` → redirige a `/cases/{caseId}`.

## Datos disponibles que hoy NO se muestran (oportunidad)

- `contract.parties` (claimant + respondent con label y address).
- `contract.sampleEvidence[]` (evidencia inicial del reclamante — se envía al backend pero no se previsualiza).
- `contract.contractType` y `contract.chain`.

## Problemas de UX actuales

1. Todas las cards se ven iguales y planas; no hay jerarquía ni diferenciación entre tipos de caso.
2. El input de address del respondent es técnico y aparece sin contexto; intimida.
3. No se ve quién es el claimant ni la evidencia que ya trae el caso.
4. No hay sensación de "elegir un escenario"; parece un formulario, no una galería de demos.
5. Las reglas se muestran como lista cruda, sin diseño.
6. No hay indicación visual de los pasos del flujo (estás en el paso 1 de N).

## Objetivo del rediseño

Que elegir un caso de demo se sienta como **elegir un escenario** claro y atractivo: tarjetas ricas (tipo de contrato, partes, monto si aplica, reglas resumidas, preview del reclamo), con la acción principal destacada y el detalle técnico (address) escondido o secundario.

---

# VISTA 2 — Sala del caso (`/cases/[caseId]`)

**Archivos:** `apps/web/src/app/cases/[caseId]/page.tsx`, `apps/web/src/components/respond-form.tsx`

## Qué es

La **sala de mediación**. El usuario (respondent) lee el reclamo en su contra, las reglas y la evidencia del reclamante, y **responde** (texto + archivos opcionales) firmando con su wallet.

## Qué muestra hoy (en orden, cards apiladas)

| # | Card | Contenido |
|---|---|---|
| Header | PageHeader | "Sala de mediación" + origen del contrato + badge de estado |
| 1 | El reclamo en tu contra | `claim`, quién reclama (claimant), vos (respondent), deadline (`expiresAt`) |
| 2 | Reglas del contrato | `rules[]` numeradas (el agente decide con esto) |
| 3 | Evidencia del reclamante | items de audit (`EVIDENCE_SUBMITTED`, role CLAIMANT) + link a tx |
| 4 | Tu respuesta **o** Caso resuelto | si `DISPUTED`: formulario. Si `RESOLVED`: resolución + link |
| 5 | Trazabilidad on-chain | timeline de todos los eventos del audit + links a tx |

### Formulario de respuesta (`RespondForm`, si status = DISPUTED)

- Textarea "Tu descargo" (obligatorio).
- Input file múltiple (opcional); lista nombre + KB.
- Hint: cada archivo = 1 firma + 1 firma por la respuesta.
- Botón "Enviar respuesta y pasar a resolución".
- Estados de carga: "Conectando wallet…", "Firmando evidencia X/Y…", "Firmando tu respuesta…", "Redirigiendo…".
- Validación: la wallet conectada debe ser la del respondent del caso.

### Qué hace al enviar

1. Por cada archivo: firma en Arkiv (`writeEvidenceToArkiv`) → `POST /cases/:id/evidence`.
2. Firma la respuesta (`writeResponseToArkiv`) → `POST /cases/:id/respond` (esto extiende el TTL +24h en backend).
3. Redirige a `/cases/{caseId}/resolution`.

## Estados posibles del caso

`DISPUTED` (responder activo) · `RESOLVED` (muestra resolución) · `OPEN` / `EXPIRED_NO_DISPUTE` / `CANCELLED`.

## Datos disponibles que hoy NO se muestran bien

- La **respuesta ya enviada** por el respondent (queda solo en el audit).
- La **evidencia del respondent** como bloque propio.
- `expiresAt` como **countdown / urgencia** (hoy es solo texto).
- Partes con roles claros (hoy address truncada en texto).

## Problemas de UX actuales

1. Todo son cards apiladas verticalmente; no hay layout de 2 columnas (contexto vs acción).
2. El reclamo, las reglas y la evidencia compiten visualmente; no hay foco.
3. El formulario de respuesta está al final, perdido entre cards.
4. El deadline no transmite urgencia.
5. No hay stepper que indique "Paso 2: revisá y respondé".
6. La trazabilidad on-chain es una lista de texto plano poco atractiva.
7. El input de archivos es el `<input type=file>` nativo, sin estilo.

## Objetivo del rediseño

Que la sala se sienta como un **expediente claro**: a la izquierda el contexto (reclamo + reglas + pruebas en contra), a la derecha la acción (tu descargo + adjuntar archivos), con deadline visible y la trazabilidad como timeline elegante (reutilizar `.mr-timeline`). Foco en que el respondent entienda rápido qué le reclaman y cómo defenderse.

---

# VISTA 3 — Resolución (`/cases/[caseId]/resolution`)

**Archivos:** `apps/web/src/app/cases/[caseId]/resolution/page.tsx`, `apps/web/src/components/resolution-flow.tsx`

## Qué es

La pantalla donde el **agente de IA decide automáticamente** y se muestra el veredicto.

## Comportamiento

Al entrar, si el caso está `DISPUTED`, llama solo a `POST /cases/:id/resolve` (sin botón). Tiene 3 fases:

### Fase A — Analizando
- Card "El agente está evaluando el caso" + spinner CSS + texto "Analizando el reclamo, tu respuesta y las reglas…".

### Fase B — Error
- Mensaje + botón "Reintentar".

### Fase C — Decisión (lo importante)

| Campo | Dato |
|---|---|
| Headline | Label humano según outcome (ej. "Favorable al PROVEEDOR — se libera el pago") |
| Badge | RESOLVED |
| Outcome | Código técnico (`RELEASE_TO_PROVIDER`, etc.) |
| Confianza | Porcentaje |
| Razonamiento | Texto del agente |
| Acción recomendada | Texto |
| Evaluación por regla | Lista: regla → favorece Cliente/Proveedor/Neutral → rationale |
| On-chain | Link "Ver transacción" si hay txUrl |
| CTAs | "Ver caso cerrado" · "Volver a disputas" |

### Outcomes y labels

| Outcome | Label |
|---|---|
| `REFUND_TO_CLIENT` | Favorable al CLIENTE — reembolso |
| `RELEASE_TO_PROVIDER` | Favorable al PROVEEDOR — se libera el pago |
| `SPLIT_PAYMENT` | Resolución parcial — se reparte |
| `REQUEST_MORE_EVIDENCE` | Falta evidencia |
| `MANUAL_REVIEW` | Revisión manual |

Si el caso ya estaba `RESOLVED`, carga el análisis del audit (`AGENT_DECISION`) sin re-resolver.

## Problemas de UX actuales

1. El "analizando" es un spinner mínimo; no genera expectativa ni explica qué está pasando.
2. El veredicto es una card de texto; el resultado (a favor de quién) no se destaca lo suficiente.
3. La evaluación por regla es una lista `<ul>` cruda.
4. No hay resumen del caso (reclamo vs respuesta) para dar contexto al veredicto.
5. La confianza es solo un número; podría ser una barra/visual.
6. No explica qué pasa después en el contrato externo (reembolso vs liberar pago).

## Objetivo del rediseño

Que la decisión se sienta como un **veredicto claro y confiable**: estado de "analizando" con más presencia, veredicto grande con color según a quién favorece, confianza como barra, evaluación regla-por-regla en cards/tabla, y un resumen del caso arriba. Reforzar la trazabilidad on-chain (link a Braga).

---

## Sistema de diseño a reutilizar (ya existe)

Archivo: `apps/web/src/app/globals.css`

| Token / clase | Uso |
|---|---|
| `--background`, `--surface`, `--surface-elevated` | fondos |
| `--text-primary/secondary/muted` | textos |
| `--border`, `--border-strong` | bordes suaves |
| `--success`, `--warning`, `--danger` | estados/outcomes |
| `.mr-card`, `.mr-card--elevated` | tarjetas |
| `.mr-btn` (`--primary/--secondary/--ghost/--sm`) | botones |
| `.mr-badge`, `.mr-chip` | etiquetas/estados |
| `.mr-grid` (`-2/-3/-4`) | grids responsive |
| `.mr-timeline`, `.mr-step` | timelines (ideal para audit + flujo) |
| `.mr-tabs`, `.mr-tab` | tabs |
| `.mr-flow`, `.mr-flow-node` (`--yes/--no`) | diagramas de estado |
| `.mr-editor` | bloques de código/JSON |
| Geist Sans / Geist Mono | tipografía (variables `--font-geist-*`) |

> **Importante:** componentes como `PageHeader`, `PlaceholderCard`, `StatusBadge`, `Card`, `Button` vienen de `@mediation-rooms/ui` (`packages/ui/src/index.tsx`) y usan estilos viejos (inline, paleta fría). El refactor debería migrar estas vistas a las clases `.mr-*` o actualizar el `packages/ui` para alinearlo a la paleta nueva.

---

## Reglas que NO cambiar (lógica)

- Endpoints y payloads de la API.
- El flujo de firmas en Arkiv Braga (1 firma por archivo + 1 por respuesta).
- La validación de que la wallet conectada sea el respondent.
- Los nombres de los estados y outcomes.
- Las rutas (`/sandbox`, `/cases/[id]`, `/cases/[id]/resolution`).

Solo cambia la **presentación, layout, jerarquía visual y microcopy**.

---

## Prompt sugerido para otro agente

```
Refactorizá SOLO la UX/UI (sin tocar lógica, API, firmas ni rutas) de estas 3 vistas
de Mediation Rooms, siguiendo docs/demo-views-ux.md y reutilizando el sistema de diseño
de apps/web/src/app/globals.css (paleta cálida, Geist, clases .mr-*):

1. /sandbox — galería de escenarios de demo (cards ricas: tipo, partes, reglas resumidas,
   preview del reclamo). Acción principal destacada, address del respondent secundaria.
2. /cases/[id] — sala como expediente: 2 columnas (contexto: reclamo+reglas+pruebas / acción:
   descargo+archivos), deadline con urgencia, audit como timeline, file input estilizado.
3. /cases/[id]/resolution — veredicto claro: estado "analizando" con presencia, resultado
   grande con color por outcome, confianza como barra, evaluación por regla en cards,
   resumen del caso arriba, link on-chain a Braga.

Agregar un stepper (Paso 1 Sandbox → 2 Sala → 3 Resolución) para guiar el flujo.
No cambiar endpoints, payloads, estados ni nombres de outcomes.
```
