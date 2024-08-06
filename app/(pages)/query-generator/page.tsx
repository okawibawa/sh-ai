"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useFormState } from "react-dom";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { StyledResponse } from "@/components/styled-response";

import { queryGeneratorAction } from "@/actions";

import { fileListFormSchema, queryFormSchema } from "@/dtos";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function QueryGenerator() {
  const [isSchemaRead, setIsSchemaRead] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(queryGeneratorAction, {
    message: "",
    mode: "",
    status: "",
    data: "",
  });

  const fileForm = useForm<z.infer<typeof fileListFormSchema>>({
    resolver: zodResolver(fileListFormSchema),
  });

  const queryForm = useForm<z.infer<typeof queryFormSchema>>({
    resolver: zodResolver(queryFormSchema),
  });

  const mode = useCallback(() => {
    if (state.message && state.mode === "insert") {
      if (state.status === "success") setIsSchemaRead(true);
    }
  }, [setIsSchemaRead, state]);

  const handleRemoveSchema = () => {
    fileForm.reset();
    queryForm.reset();
    state.status = "";
    state.data = "";
    state.mode = "";
    state.message = "";
    setIsSchemaRead(false);
  };

  useEffect(() => {
    if (
      state.status === "error" &&
      state.message === "Rate limit exceeded. Please try again later."
    )
      return;

    mode();
  }, [state, mode]);

  return (
    <>
      <section className="space-y-2">
        <p className="text-sm">
          Insert your SQL schema here. Must be{" "}
          <code className="bg-gray-200 rounded-sm">.sql</code>
        </p>

        <div className={`flex ${isSchemaRead && "gap-2"}`}>
          <Form {...fileForm}>
            <form
              className="text-left flex gap-2 w-full"
              action={formAction}
              onSubmit={fileForm.handleSubmit((data) => {
                startTransition(async () => {
                  try {
                    const formData = new FormData();

                    formData.append("file", data.file[0]);
                    formData.append("mode", "insert");

                    await formAction(formData);
                  } catch (error) {
                    console.error(error);
                  }
                });
              })}
            >
              <FormField
                control={fileForm.control}
                name="file"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input
                        {...fileForm.register("file")}
                        type="file"
                        accept=".sql"
                        multiple={false}
                        disabled={isPending || isSchemaRead}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isSchemaRead && (
                <Button type="submit" disabled={isPending}>
                  Submit
                </Button>
              )}
            </form>
          </Form>

          {isSchemaRead && (
            <Button
              variant="destructive"
              onClick={handleRemoveSchema}
              disabled={isPending}
            >
              Resubmit Schema
            </Button>
          )}
        </div>
      </section>

      {isSchemaRead && (
        <section className="space-y-2">
          <p className="text-sm">
            Insert your query here. Make sure to make it clear enough.
          </p>
          <Form {...queryForm}>
            <form
              className="text-left flex gap-2"
              action={formAction}
              onSubmit={queryForm.handleSubmit((data) => {
                startTransition(async () => {
                  try {
                    const formData = new FormData();

                    formData.append("query", data.query);
                    formData.append("mode", "query");

                    await formAction(formData);
                  } catch (error) {
                    console.error(error);
                  }
                });
              })}
            >
              <FormField
                control={queryForm.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Textarea
                        {...queryForm.register("query")}
                        placeholder="e.g. how do i query all users who purchased item x?"
                        disabled={isPending}
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
      )}

      {state.status === "error" && (
        <section className="space-y-2">
          <h2 className="font-semibold">Error</h2>
          <p className="text-red-500">{state.message}</p>
        </section>
      )}

      {state.status === "success" && (
        <>
          {state.mode === "insert" && (
            <section className="space-y-2">
              <h2 className="font-semibold">SQL Schema</h2>
              <p>{state.message}</p>
            </section>
          )}

          {state.mode === "query" && (
            <section className="space-y-2">
              <h2 className="font-semibold">Result</h2>
              <StyledResponse response={state.data} />
            </section>
          )}
        </>
      )}
    </>
  );
}
