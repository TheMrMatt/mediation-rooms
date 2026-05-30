import type { Case } from "@mediation-rooms/config";
import { RespondForm } from "../respond-form";
import { OUTCOME_HEADLINE } from "./lib";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ResponseComposerCard({
  caseRecord,
  hasResponse,
  responseText,
  respondentEvidence = [],
}: {
  caseRecord: Case;
  hasResponse: boolean;
  responseText?: string;
  respondentEvidence?: string[];
}) {
  const caseId = caseRecord.caseId;

  if (caseRecord.status === "RESOLVED") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Caso resuelto</CardTitle>
          <CardDescription>
            {OUTCOME_HEADLINE[caseRecord.resolution] ?? caseRecord.resolution}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" size="lg" asChild>
            <a href={`/cases/${caseId}/resolution`}>Ver la decisión del agente</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (hasResponse && caseRecord.status === "DISPUTED") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Respuesta enviada</CardTitle>
          <CardDescription>
            Tu respuesta quedó registrada y el caso está listo para la resolución
            del agente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {responseText && (
            <p className="bg-muted rounded-md p-3 text-sm leading-relaxed">
              “{responseText}”
            </p>
          )}
          {respondentEvidence.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Tu evidencia</p>
              <ul className="text-muted-foreground space-y-1 text-sm">
                {respondentEvidence.map((e, i) => (
                  <li key={i}>· {e}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" size="lg" asChild>
            <a href={`/cases/${caseId}/resolution`}>Continuar a la resolución</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu respuesta</CardTitle>
        <CardDescription>
          Contá tu versión del caso. Podés sumar evidencia si ayuda a defender tu
          posición.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RespondForm caseRecord={caseRecord} />
      </CardContent>
    </Card>
  );
}
