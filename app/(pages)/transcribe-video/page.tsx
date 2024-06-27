"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFormState } from "react-dom";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { transcribeVideoAction } from "@/actions";

import { urlFormSchema } from "@/dtos";

export default function VideoTranscriber() {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(transcribeVideoAction, {
    message: "",
  });

  const form = useForm<z.infer<typeof urlFormSchema>>({
    resolver: zodResolver(urlFormSchema),
    defaultValues: {
      url: "",
    },
  });

  return (
    <>
      <section className="space-y-2">
        <p className="text-sm">Paste YouTube URL here.</p>

        <Form {...form}>
          <form
            className="flex gap-2 text-left"
            action={formAction}
            onSubmit={form.handleSubmit((data) => {
              startTransition(async () => {
                try {
                  const formData = new FormData();

                  formData.append("url", data.url);

                  await formAction(formData);
                } catch (error: any) {
                  console.error("Form submission error: ", error.message);
                }
              });
            })}
          >
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input
                      placeholder="e.g. https://youtu.be/..."
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              Search
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
