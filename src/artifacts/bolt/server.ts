import { z } from "zod";
import { ArtifactHandler } from "@/lib/artifacts/server";

// Define the schema for bolt artifact data
export const boltArtifactDataSchema = z.object({
  kind: z.literal("js-project-bolt"),
  files: z.record(z.string()),
  entryFile: z.string(),
  dependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional(),
  template: z.string().optional(),
  startCommand: z.string().optional(),
});

export type BoltArtifactData = z.infer<typeof boltArtifactDataSchema>;

// Create the bolt artifact handler
export const boltArtifactHandler: ArtifactHandler<BoltArtifactData> = {
  kind: "js-project-bolt",
  schema: boltArtifactDataSchema,
  
  // Create a new bolt artifact
  async create(data) {
    return {
      kind: "js-project-bolt",
      files: data.files || {},
      entryFile: data.entryFile || "index.js",
      dependencies: data.dependencies || {},
      devDependencies: data.devDependencies || {},
      template: data.template,
      startCommand: data.startCommand || "npm start",
    };
  },
  
  // Update an existing bolt artifact
  async update(existing, data) {
    return {
      ...existing,
      files: data.files || existing.files,
      entryFile: data.entryFile || existing.entryFile,
      dependencies: data.dependencies || existing.dependencies,
      devDependencies: data.devDependencies || existing.devDependencies,
      template: data.template || existing.template,
      startCommand: data.startCommand || existing.startCommand,
    };
  },
};
