"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createInvoice } from "@/lib/actions/invoice";
import { idleState } from "@/lib/action-state";
import { formatEuro } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";

type InvoiceFormProps = {
  clients: { id: string; name: string }[];
  preselectedClientId: string | null;
  defaultService: string;
  defaultUnitPriceEuro: string;
};

type ItemDraft = {
  key: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "80,50" | "80.5" → Cent (0, wenn noch nichts Brauchbares drinsteht). */
function draftCents(item: ItemDraft): number {
  const price = Number(item.unitPrice.replace(",", "."));
  const quantity = Number(item.quantity);
  if (!Number.isFinite(price) || !Number.isFinite(quantity)) return 0;
  return Math.max(0, Math.round(price * 100)) * Math.max(0, Math.floor(quantity));
}

export function InvoiceForm({
  clients,
  preselectedClientId,
  defaultService,
  defaultUnitPriceEuro,
}: InvoiceFormProps) {
  const [state, formAction, pending] = useActionState(createInvoice, idleState);
  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  const [items, setItems] = useState<ItemDraft[]>(() => [
    { key: 1, description: defaultService, quantity: "1", unitPrice: defaultUnitPriceEuro },
  ]);
  const [nextKey, setNextKey] = useState(2);

  const [today] = useState(() => isoDate(new Date()));
  const [dueDefault] = useState(() => isoDate(new Date(Date.now() + 14 * 86_400_000)));

  const totalCents = items.reduce((sum, item) => sum + draftCents(item), 0);

  function addItem() {
    setItems((current) => [
      ...current,
      { key: nextKey, description: "", quantity: "1", unitPrice: defaultUnitPriceEuro },
    ]);
    setNextKey((key) => key + 1);
  }

  function removeItem(key: number) {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.key !== key) : current));
  }

  function updateItem(key: number, patch: Partial<ItemDraft>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  const itemErrors = Object.entries(fieldErrors)
    .filter(([field]) => field.startsWith("items"))
    .flatMap(([, messages]) => messages);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" && (
        <Alert tone="error" title="Das hat noch nicht geklappt.">
          {state.message}
        </Alert>
      )}

      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Empfänger:in</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Nur Menschen aus deiner Kund:innenliste - also Personen, die dir bereits geschrieben
            haben.
          </p>
        </div>

        <Field label="Kund:in" htmlFor="clientId" required error={fieldErrors.clientId}>
          <Select
            id="clientId"
            name="clientId"
            required
            defaultValue={preselectedClientId ?? ""}
          >
            <option value="" disabled>
              Bitte wählen …
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Name auf der Rechnung"
          htmlFor="recipient"
          hint="Falls die Person dir ihren Klarnamen genannt hat - sonst bleibt das Pseudonym."
          error={fieldErrors.recipient}
        >
          <Input id="recipient" name="recipient" placeholder="Optional" autoComplete="off" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Leistungsdatum" htmlFor="serviceDate" required error={fieldErrors.serviceDate}>
            <Input id="serviceDate" name="serviceDate" type="date" defaultValue={today} required />
          </Field>
          <Field label="Fällig bis" htmlFor="dueDate" required error={fieldErrors.dueDate}>
            <Input id="dueDate" name="dueDate" type="date" defaultValue={dueDefault} required />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Positionen</h2>
          <p className="mt-1 text-sm text-ink-soft">Was war die Leistung, wie oft, zu welchem Preis?</p>
        </div>

        {itemErrors.length > 0 && (
          <ul className="space-y-1 rounded-xl border border-danger/30 bg-danger-soft p-3 text-xs font-medium text-danger">
            {itemErrors.map((message, index) => (
              <li key={`${message}-${index}`}>{message}</li>
            ))}
          </ul>
        )}

        <div
          aria-hidden
          className="hidden gap-2 text-xs font-medium text-ink-faint sm:grid sm:grid-cols-[1fr_5rem_7.5rem_2.5rem]"
        >
          <span>Beschreibung</span>
          <span>Menge</span>
          <span>Einzelpreis (EUR)</span>
          <span />
        </div>

        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={item.key}
              className="grid grid-cols-[1fr_2.5rem] gap-2 rounded-xl border border-line bg-paper-soft/40 p-3 sm:grid-cols-[1fr_5rem_7.5rem_2.5rem] sm:border-0 sm:bg-transparent sm:p-0"
            >
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor={`item-desc-${item.key}`} className="sr-only">
                  Beschreibung Position {index + 1}
                </label>
                <Input
                  id={`item-desc-${item.key}`}
                  name="itemDescription"
                  value={item.description}
                  onChange={(event) => updateItem(item.key, { description: event.target.value })}
                  placeholder="z. B. Lebensberatung, Einzelgespräch (60 Min)"
                  required
                />
              </div>
              <div className="flex gap-2 sm:contents">
                <div className="w-24 sm:w-auto">
                  <label htmlFor={`item-qty-${item.key}`} className="sr-only">
                    Menge Position {index + 1}
                  </label>
                  <Input
                    id={`item-qty-${item.key}`}
                    name="itemQuantity"
                    type="number"
                    min={1}
                    max={999}
                    step={1}
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={(event) => updateItem(item.key, { quantity: event.target.value })}
                    required
                  />
                </div>
                <div className="w-32 sm:w-auto">
                  <label htmlFor={`item-price-${item.key}`} className="sr-only">
                    Einzelpreis in Euro, Position {index + 1}
                  </label>
                  <Input
                    id={`item-price-${item.key}`}
                    name="itemUnitPrice"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(event) => updateItem(item.key, { unitPrice: event.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.key)}
                disabled={items.length === 1}
                aria-label={`Position ${index + 1} entfernen`}
                className="flex h-11 w-10 items-center justify-center self-start justify-self-end rounded-full text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-40"
              >
                <Trash2 className="size-4.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        <Button type="button" variant="ghost" size="sm" onClick={addItem}>
          <Plus className="size-4" aria-hidden />
          Position
        </Button>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm font-medium text-ink-soft">Gesamtbetrag</span>
          <span className="text-lg font-semibold tabular-nums text-ink" aria-live="polite">
            {formatEuro(totalCents)}
          </span>
        </div>
      </Card>

      <Card className="space-y-5">
        <Field
          label="Notiz"
          htmlFor="note"
          hint="Optional - steht unter den Positionen auf der Rechnung."
          error={fieldErrors.note}
        >
          <Input id="note" name="note" placeholder="z. B. Danke für das Gespräch am Dienstag." />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Wird ausgestellt …" : "Rechnung ausstellen"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
