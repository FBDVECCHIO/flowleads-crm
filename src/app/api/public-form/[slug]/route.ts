import { PipeService } from "../../../../services/pipeService.ts";
import { CardService } from "../../../../services/cardService.ts";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const pipe = await PipeService.getPublicFormBySlug(slug);
    if (!pipe) {
      return Response.json({ error: "Formulário público não encontrado ou desativado." }, { status: 404 });
    }

    return Response.json({
      pipeId: pipe.id,
      pipeName: pipe.name,
      description: pipe.description,
      icon: pipe.icon,
      color: pipe.color,
      fields: pipe.fields,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const pipe = await PipeService.getPublicFormBySlug(slug);
    if (!pipe) {
      return Response.json({ error: "Formulário não encontrado." }, { status: 404 });
    }

    const body = await req.json();
    const fieldValues = body.fieldValues || body;

    const missing = pipe.fields.filter(
      (f) => f.isRequired && (!fieldValues[f.identifier] || String(fieldValues[f.identifier]).trim() === "")
    );

    if (missing.length > 0) {
      return Response.json(
        { error: `Campos obrigatórios não preenchidos: ${missing.map((m) => m.label).join(", ")}` },
        { status: 422 }
      );
    }

    const title =
      fieldValues.lead_name && fieldValues.company_name
        ? `${fieldValues.company_name} - ${fieldValues.lead_name}`
        : fieldValues.company_name || fieldValues.lead_name || "Novo Lead Web";

    const dealValue = fieldValues.deal_value ? parseFloat(String(fieldValues.deal_value).replace(/[^\d.-]/g, "")) : 0;

    const newCard = await CardService.createCard({
      pipeId: pipe.id,
      title,
      dealValue: isNaN(dealValue) ? 0 : dealValue,
      fieldValues,
    });

    return Response.json({
      success: true,
      message: "Lead recebido com sucesso! Nossa equipe entrará em contato em breve.",
      cardId: newCard?.id,
    }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}