import { z } from "zod";

// Avoid runtime code generation and CSP eval probes before schemas initialize.
z.config({ jitless: true });
