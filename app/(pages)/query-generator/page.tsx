"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFormState } from "react-dom";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { transcribeVideoAction } from "@/actions";

import { sqlSchemaFileSchema } from "@/dtos";

export default function QueryGenerator() {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(transcribeVideoAction, {
    message: "",
  });

  const form = useForm<z.infer<typeof sqlSchemaFileSchema>>({
    resolver: zodResolver(sqlSchemaFileSchema),
    defaultValues: {
      file: undefined,
    },
  });

  return (
    <>
      <section className="space-y-2">
        <p className="text-sm">Insert your SQL schema here.</p>

        <Form {...form}>
          <form
            className="text-left"
            action={formAction}
            onSubmit={form.handleSubmit((data) => {
              startTransition(async () => {
                try {
                  const formData = new FormData();

                  console.log({ data });

                  // formData.append("url", data.file);

                  // await formAction(formData);
                } catch (error: any) {
                  console.error("Form submission error: ", error.message);
                }
              });
            })}
          >
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input {...field} type="file" accept=".sql" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </section>

      {state.message && (
        <section className="space-y-2">
          <h2 className="font-semibold">Transcription</h2>
          <p>{state.message}</p>
        </section>
      )}
    </>
  );
}
