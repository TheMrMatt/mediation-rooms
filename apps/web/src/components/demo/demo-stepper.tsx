const STEPS = [
  "Elegir caso",
  "Revisar reclamo",
  "Enviar respuesta",
  "Ver decisión",
];

/** Stepper guía del flujo de demo. `current` va de 1 a 4. */
export function DemoStepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <nav className="mr-stepper" aria-label="Progreso de la demo">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const state =
          step < current ? "done" : step === current ? "active" : "pending";
        return (
          <span key={label} style={{ display: "inline-flex", alignItems: "center" }}>
            <span className="mr-stepper-item" data-state={state}>
              <span className="mr-stepper-num">{step < current ? "✓" : step}</span>
              <span className="mr-stepper-label">{label}</span>
            </span>
            {step < STEPS.length && <span className="mr-stepper-sep" />}
          </span>
        );
      })}
    </nav>
  );
}
