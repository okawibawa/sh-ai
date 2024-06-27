"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFormState } from "react-dom";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { queryGeneratorAction } from "@/actions";

import { fileListFormSchema } from "@/dtos";
import { Button } from "@/components/ui/button";

export default function QueryGenerator() {
  const [selectedFile, setSelectedFile] = useState<File | null>();
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(queryGeneratorAction, {
    message: "",
  });

  const form = useForm<z.infer<typeof fileListFormSchema>>({
    resolver: zodResolver(fileListFormSchema),
  });

  return (
    <>
      <section className="space-y-2">
        <p className="text-sm">
          Insert your SQL schema here. Must be <code className="bg-gray-200 rounded-sm">.sql</code>
        </p>

        <Form {...form}>
          <form
            className="text-left flex gap-2"
            action={formAction}
            onSubmit={form.handleSubmit((data) => {
              startTransition(async () => {
                startTransition(async () => {
                  try {
                    const formData = new FormData();

                    formData.append("file", data.file[0]);

                    await formAction(formData);
                  } catch (error) {
                    console.error(error);
                  }
                });
              });
            })}
          >
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input
                      {...form.register("file")}
                      type="file"
                      accept=".sql"
                      multiple={false}
                      // onChange={(e) => {
                      //   const file = e.target.files?.[0];
                      //   field.onChange(file);
                      // }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              Submit
            </Button>
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
