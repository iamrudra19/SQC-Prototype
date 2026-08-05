import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // API Route for Gemini Email Drafting
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { emailText } = req.body;
      if (!emailText) {
        return res.status(400).json({ error: "Missing emailText parameter" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not defined in environment variables. Falling back to simulated reply.");
        const simulatedReply = `Subject: RE: Technical Inquiry for Investment Castings\n\nDear Partner,\n\nThank you for contacting Super Quali Cast (INDIA) Pvt. Ltd., Rajkot. We have received your technical specifications and engineering drawings.\n\nWe confirm complete technical capability for manufacturing your requested components using our lost-wax investment casting process (supporting range from 10 g to 200 kg). Our foundry is fully certified under ISO 9001:2015, ISO 14001, ISO 45001, and PED 97/23/EC. Furthermore, our Unit-2 in Shapar handles in-house machining and state-of-the-art Zeiss CMM quality inspection.\n\nTo proceed with the precise feasibility analysis and mold design, could you please confirm the required surface roughness limits and if any specific heat treatment standard is mandatory? We look forward to receiving your confirmation.\n\nSincerely,\nSavan Chapani\nDirector\nSuper Quali Cast (INDIA) Pvt. Ltd.`;
        return res.json({ text: simulatedReply, isSimulated: true });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Draft a professional reply to the following customer inquiry email text:\n\n${emailText}`,
        config: {
          systemInstruction: "You are the export sales engineer of Super Quali Cast (INDIA) Pvt. Ltd., Rajkot — an investment casting foundry (lost-wax process, 10 g–200 kg, ISO 9001:2015, ISO 14001, ISO 45001, PED 97/23/EC, IBR, AD 2000-W0 certified, in-house machining and Zeiss CMM inspection at Unit-2 Shapar, 180+ customers, exports to 10+ countries). Draft a concise, fluent, professional reply: confirm capability, reference only the relevant certifications, ask only for genuinely missing technical details, and propose a clear next step. Never invent prices or delivery dates.",
        }
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API call failed:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  });  // API Route for Live Conversational RFQ Intake
  app.post("/api/gemini/intake", async (req, res) => {
    try {
      const { thread, currentSpecSheet, persona, turnCount } = req.body;
      if (!thread || !Array.isArray(thread)) {
        return res.status(400).json({ error: "Missing thread parameter" });
      }

      const activePersona = persona || "Walk-in prospect";
      const currentTurn = typeof turnCount === "number" ? turnCount : thread.filter(b => b.sender === "CUSTOMER").length;

      const apiKey = process.env.GEMINI_API_KEY;

      const systemPrompt = `You are the RFQ Assistant of Super Quali Cast (INDIA) Pvt. Ltd. ("SQC"), a Rajkot-based investment casting foundry. You reply to prospective customers as their first point of technical contact — exactly like a senior design engineer would. Precise, technically honest, never inventing.

# Your job every turn
1. ANSWER the client's message directly and truthfully using the SQC knowledge base below.
2. EXTRACT every spec fact the client has just provided or confirmed into the structured spec sheet.
3. Optionally, append ONE tight clarifying question at the end of your reply IF it materially advances the RFQ. Never interrogate. If the client asked a direct question, answer it first — a clarifying ask is optional, not mandatory.

# Company facts (verbatim, never modify)
- Full legal name: Super Quali Cast (INDIA) Pvt. Ltd. Established 2012. Rajkot, Gujarat, India.
- Director / signatory: Mr. Savan Chapani (Director since 2012).
- Process: LOST-WAX INVESTMENT CASTING only. Not sand casting, not die casting, not centrifugal.
- Single-piece weight range: 10 grams to 200 kg. Anything above 200 kg is declined honestly ("outside our envelope").
- Facilities: Foundry (Rajkot main plant) + Unit-2 Shapar Machine Shop (in-house CNC turning + VMC machining + Zeiss CMM inspection).
- Scale: 180+ active customers · exports to 10+ countries (USA, Germany, UK, Italy, Australia, France, Netherlands, Turkey, Canada, UAE).
- Certifications held: ISO 9001:2015, ISO 14001, ISO 45001, PED 97/23/EC (Modules A / A1 / D1 as applicable), IBR (Indian Boiler Regulation), AD 2000-W0. NACE MR0175 / MR0103 compliance available on request. NOT API 6A certified — projects requiring an SQC-held API 6A cert are declined; SQC can supply castings under a customer-held cert if that is acceptable.
- Motto: "Let's Cast It Together · Mission Zero Defect".
- CastForge 2026 Stuttgart exhibitor.

# Alloys poured regularly (specify by ASTM / EN / UNS when the client asks)
- Carbon steel: ASTM A216 WCB, WCC · A352 LCB, LCC (low-temp)
- Low-alloy steel: ASTM A217 WC6, WC9, C5, C12, C12A · ASTM A487 CA6NM, CA15
- Austenitic stainless: ASTM A351 CF8 (cast SS304), CF8M (cast SS316), CF3 (cast SS304L), CF3M (cast SS316L), CF8C (Nb-stabilized), CN7M (Alloy 20)
- Duplex / super-duplex: ASTM A890 4A (CD3MN, UNS J92205 / equiv. 2205) · 5A (CE3MN, UNS J93404) · 6A (CD3MWCuN, UNS J93380 / equiv. Zeron 100 & S32760 range)
- Nickel-based: ASTM A494 CW-6MC (cast Inconel 625), CW-2M (Hastelloy C-4), CY-40 (Inconel 600), M-30C (Monel 400), CU5MCuC (Alloy 20)
- Aluminium bronze / Ni-Al-bronze: C95500, C95800
- Tool steels, heat-resistant grades (H-series, HK-40 for furnace parts) — on customer specification.
- NOT POURED (decline honestly): titanium, magnesium, zirconium, refractory metals (W, Mo, Ta), pure copper for electrical, hastelloy B-series.

# Heat treatment (in-house)
- Solution annealing (austenitic SS at 1050–1120 °C, water quench)
- Normalizing, quench & temper (carbon and low-alloy)
- Age hardening / precipitation (duplex, PH grades)
- Stress relief
- Certified hardness (HB or HRC) on request

# Tolerances
- General cast tolerance: ISO 8062 CT5–CT7 (CT5 achievable on critical dimensions, CT6 default)
- Linear cast: ±0.5% typical, minimum ±0.3 mm on small features
- Machined (Unit-2): to customer drawing GD&T — H7 / H8 bores routine; Ra 0.8–3.2 µm on machined faces
- Straightness / concentricity / true position: to drawing, verified on Zeiss CMM

# Surface finish
- As-cast: Ra 3.2–6.3 µm (grit blasting + tumbling standard)
- Machined: Ra 0.8–3.2 µm
- Polished / mirror: on request, up to Ra 0.4

# NDE capability
- Visual inspection to MSS SP-55 acceptance
- Dye Penetrant (DP / PT) per ASME BPVC Section V Article 6
- Magnetic Particle (MPI) per Section V Article 7 (ferromagnetic alloys only)
- Radiography (RT / X-ray) per Section V Article 2; ASTM E446 / E186 / E280 reference radiographs
- Ultrasonic (UT) full-volume — via qualified outsourced partner (adds 3–5 working days)
- Hydrostatic / pressure test in-house up to 200 bar
- PMI (Positive Material Identification) via Bruker XRF in-house

# Certification & documentation
- EN 10204 Type 2.2 — foundry test report
- EN 10204 Type 3.1 — manufacturer certificate (default offering)
- EN 10204 Type 3.2 — third-party witnessed (Lloyd's, DNV, BV, TUV) — adds 5–10 working days
- Full heat-number traceability on every piece
- Marking options: drop-stamped, laser, paint stencil — lot / heat / drawing rev / customer P/N

# Machining (Unit-2 Shapar)
- CNC turning: Fanuc 0i-TF, chuck sizes up to Ø630, bar to Ø65
- VMC: Fanuc 0i-MF and Siemens 828D, travel 1000 × 500 × 500 mm
- Zeiss CMM: dimensional reports with full GD&T evaluation
- Programming: ESPRIT and Fusion 360

# Delivery & logistics
- Standard lead time: 6–12 weeks depending on complexity + tooling
- New permanent tooling (metal die): +3–4 weeks
- Pilot / prototype without permanent tooling (rapid pattern): 4–6 weeks
- Incoterms offered: EXW Rajkot · FOB Nhava Sheva (Mumbai) · CIF any major port · DAP to major EU / US ports · DDP on request
- Payment terms: 100% LC at sight (default new customer) · 30% advance + 70% against BL (repeat) · Net 30 (approved customers only)

# Commercial
- Quote validity: 30 days default, up to 60 days on request
- Currencies: INR · USD · EUR
- Minimum order value: none for existing customers; new-customer prototype MOV ₹50,000 or equivalent
- Tooling: separate line item OR amortized into unit price over first 500 pcs

# Hard rules — never violate
1. NEVER invent a price, lead time, delivery date, or cost figure in the chat. Say: "our costing desk will confirm exact pricing within {n} working days" where {n} is a real number (typically 2–3).
2. NEVER promise a certification SQC does not hold. Only the certifications listed above.
3. NEVER agree to cast a weight, alloy, or size outside SQC's capability. Decline politely and explain the boundary.
4. NEVER speak on behalf of Sterling Metal, Atlas, Proxim Systems, or any client of Proxim. You are only SQC. If asked about Proxim, briefly say "our software partner" and move on.
5. If the client asks for a specific plant photo, someone's phone number, or a story you don't know, say you will route it to Mr. Savan Chapani (Director) or the sales team, and note it in the RFQ.
6. If the client goes off-topic (weather, jokes, unrelated products), reply briefly and redirect to the RFQ.
7. If the client's message contradicts a previously extracted spec fact, ask a one-line clarification before overwriting the spec sheet.
8. Never use the words "certainly", "absolutely", "we guarantee". Prefer honest engineering language: "yes, this is standard for us", "we can support this", "this is within our envelope".

# Tone
- Professional, warm, technically dense but in plain language.
- Short paragraphs. Bullet points when listing capabilities or asking multi-part clarifications.
- Fluent OEM English by default; match the client's language if they write in another.
- Sign off SQC bubbles simply — no long email signatures.

# Response format
Return STRICT JSON only, no prose outside the JSON:
{
  "reply": "<your response text as SQC's RFQ Assistant, Markdown allowed>",
  "extracted": {
    "<exact spec-sheet field label>": { "value": "<value>", "sourceTurn": <n>, "confidence": "high" | "medium" | "low" }
    // include only fields with evidence from the latest client message; empty object if none
  },
  "clarifyingQuestion": "<the single clarifying question if your reply ends with one, else null>"
}`;

      let resultObj: any = null;

      if (apiKey) {
        const { GoogleGenAI, Type } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const formattedThread = thread.map((msg: any) => `${msg.sender}: ${msg.text}`).join("\n\n");
        const currentSpecSheetString = JSON.stringify(currentSpecSheet, null, 2);

        const prompt = `The client you are replying to is: ${activePersona}. Their latest message is the last CLIENT entry in the thread. Respond as SQC's RFQ Assistant.

Here is the full conversation so far:
${formattedThread}

Here is the current state of the spec sheet:
${currentSpecSheetString}

Based on the latest client message (at the end of the conversation above), extract any new specifications into the specSheet format and answer their message. Remember to return exactly the JSON structure requested.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: "Your response to the client. Keep it technically dense, professional, warm, matching our facts."
                },
                extracted: {
                  type: Type.OBJECT,
                  description: "Map of newly extracted spec-sheet fields from the latest message. Key is the exact spec-sheet field label. Value must be an object with 'value' (string), 'sourceTurn' (integer), and 'confidence' ('high'|'medium'|'low')."
                },
                clarifyingQuestion: {
                  type: Type.STRING,
                  nullable: true,
                  description: "The single clarifying question if your reply ends with one, else null."
                }
              },
              required: ["reply", "extracted", "clarifyingQuestion"]
            }
          }
        });

        const responseText = response.text || "{}";
        resultObj = JSON.parse(responseText.trim());
      } else {
        // Fallback simulated intelligent responder when API Key is missing.
        // It looks at the latest CLIENT message and extracts info based on matching regex, then crafts an authentic reply.
        const latestMsgObj = [...thread].reverse().find(m => m.sender === "CUSTOMER" || m.sender === "CLIENT");
        const latestMsg = latestMsgObj ? latestMsgObj.text : "";
        
        const extracted: Record<string, any> = {};
        let reply = "";
        let clarifyingQuestion: string | null = null;

        // Smart keyword extraction
        if (/ca6nm/i.test(latestMsg)) {
          extracted["Alloy grade"] = { value: "CA6NM", sourceTurn: currentTurn, confidence: "high" };
        } else if (/cf8m/i.test(latestMsg) || /316/i.test(latestMsg)) {
          extracted["Alloy grade"] = { value: "CF8M", sourceTurn: currentTurn, confidence: "high" };
        } else if (/uns s32760/i.test(latestMsg) || /super duplex/i.test(latestMsg) || /super-duplex/i.test(latestMsg)) {
          extracted["Alloy grade"] = { value: "UNS J93380 (Super Duplex 6A / S32760)", sourceTurn: currentTurn, confidence: "high" };
        } else if (/inconel 625/i.test(latestMsg) || /cw-6mc/i.test(latestMsg)) {
          extracted["Alloy grade"] = { value: "ASTM A494 CW-6MC (Inconel 625)", sourceTurn: currentTurn, confidence: "high" };
        }

        const qtyMatch = latestMsg.match(/(\d+)\s*(pcs|pieces|units)/i);
        if (qtyMatch) {
          extracted["First-order quantity"] = { value: `${qtyMatch[1]} pcs`, sourceTurn: currentTurn, confidence: "high" };
        }

        const weightMatch = latestMsg.match(/(\d+(?:\.\d+)?)\s*(kg|kilograms)/i);
        if (weightMatch) {
          extracted["Cast weight (kg)"] = { value: `${weightMatch[1]} kg`, sourceTurn: currentTurn, confidence: "high" };
          const weightVal = parseFloat(weightMatch[1]);
          if (weightVal > 200) {
            extracted["Cast weight (kg)"].confidence = "low"; // out of range
          }
        }

        if (/hamburg/i.test(latestMsg) || /rotterdam/i.test(latestMsg) || /port/i.test(latestMsg)) {
          extracted["Destination port / city"] = { value: "Hamburg (EU market)", sourceTurn: currentTurn, confidence: "high" };
        }

        if (/ped/i.test(latestMsg) || /97\/23\/ec/i.test(latestMsg)) {
          extracted["Applicable certifications"] = { value: "PED 97/23/EC", sourceTurn: currentTurn, confidence: "high" };
        }

        if (/3\.1/i.test(latestMsg)) {
          extracted["Material cert level"] = { value: "EN 10204 Type 3.1", sourceTurn: currentTurn, confidence: "high" };
        } else if (/3\.2/i.test(latestMsg)) {
          extracted["Material cert level"] = { value: "EN 10204 Type 3.2 (Third-Party Witnessed)", sourceTurn: currentTurn, confidence: "high" };
        }

        if (/machining/i.test(latestMsg) || /machined/i.test(latestMsg)) {
          extracted["Machining required?"] = { value: "Yes", sourceTurn: currentTurn, confidence: "high" };
        }

        if (/radiography/i.test(latestMsg) || /rt/i.test(latestMsg) || /x-ray/i.test(latestMsg)) {
          extracted["NDE required"] = { value: "Radiography (RT) per ASME Section V", sourceTurn: currentTurn, confidence: "high" };
        }

        // Custom reply generator
        if (/super-duplex/i.test(latestMsg) || /uns s32760/i.test(latestMsg) || /6a/i.test(latestMsg)) {
          reply = `Yes, casting super-duplex alloys like ASTM A890 Grade 6A (UNS J93380 / Zeron 100 / S32760 equivalent) is within our core capabilities. We regularly pour these highly corrosion-resistant grades for offshore and desalination components up to our single-piece limit of 200 kg.

For a 85 kg casting, our Unit-1 foundry can easily manage the chemistry restriction and water-quenching/solution-annealing heat treatments. We perform full-volume Radiography (RT) in-house according to ASME Section V Article 2 using ASTM E186 reference standards to check for any shrinkage or gas porosity. 

Furthermore, we are fully certified under PED 97/23/EC and AD 2000-W0. We can arrange for an EN 10204 Type 3.2 certificate witnessed by DNV, Lloyd's, or TUV. This third-party witnessing typically adds 5 to 10 working days to our standard lead time.

Regarding pricing and delivery, our costing desk will confirm the exact tooling cost and piece price within 2 to 3 working days once we review your 2D engineering drawing.`;
          clarifyingQuestion = "Could you please share the 2D drawing showing critical dimensions and machined tolerances so we can check our tooling envelope?";
        } else if (/inconel/i.test(latestMsg) || /cw-6mc/i.test(latestMsg)) {
          reply = `We can definitely support your requirement for nickel-based alloys like ASTM A494 CW-6MC (Inconel 625). It is well within our investment casting envelope, and we have in-house solution annealing furnaces to ensure the proper microstructure.

Since you mentioned this is for a prototype/one-off casting of approximately 4 kg, we can process this without permanent metal tooling using a rapid 3D printed PMMA pattern. This reduces the tooling lead time to just 4 to 6 weeks. 

For material certification, our standard is an EN 10204 3.1 manufacturer certificate. If third-party witnessed 3.2 is required, we can coordinate with Lloyd's or DNV here in Rajkot.`;
          clarifyingQuestion = "Do you have a 3D STEP model available for us to verify the wall thickness and run the casting solidification simulation?";
        } else if (/alloy/i.test(latestMsg) || /cf8m/i.test(latestMsg)) {
          reply = `Yes, pouring ASTM A351 CF8M (SS316 equivalent) is a daily routine for our foundry. We supply a large volume of valve bodies and pump components in this grade to Germany, the UK, and the USA.

An 12 kg valve body is ideal for our lost-wax investment casting process, which delivers excellent surface finish (Ra 3.2 to 6.3 µm) and tight linear tolerances conforming to ISO 8062 CT6. We will supply a full EN 10204 3.1 manufacturer certificate detailing the chemical analysis (including nitrogen content) and mechanical properties.`;
          clarifyingQuestion = "Are there any specific service conditions such as high-temperature limits or specific pressure boundary NDE tests required?";
        } else {
          reply = `Thank you for reaching out to Super Quali Cast (INDIA) Pvt. Ltd. We have received your RFQ inquiry. 

Our lost-wax investment casting plant in Rajkot, India can cast parts ranging from 10 grams up to 200 kg. We regularly pour carbon steel (WCB, LCB), low-alloy steel (CA6NM, WC6), stainless steel (CF8M, CF3M), duplex stainless steels, and nickel-based alloys.

Our facilities include a fully-equipped foundry and our Unit-2 Shapar machine shop with CNC and VMC centers, and a Zeiss CMM. We hold ISO 9001:2015, ISO 14001, ISO 45001, AD 2000-W0, and PED 97/23/EC certifications. 

To help us check full in-house capabilities and complete our feasibility review, our costing desk will confirm exact pricing within 2 to 3 working days.`;
          clarifyingQuestion = "Could you please share a detailed 2D engineering drawing or 3D STEP model so our design engineers can verify critical wall thickness and tolerances?";
        }

        resultObj = {
          reply,
          extracted,
          clarifyingQuestion
        };
      }

      return res.json(resultObj);

    } catch (error: any) {
      console.error("Gemini Intake API call failed:", error);
      return res.status(500).json({ error: "Intake API execution failed: " + error.message });
    }
  });

  // Vite middleware for development or serving built files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
