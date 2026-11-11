import re
import html

# The 6 Stages and 30 Modules Curriculum provided by user

CURRICULUM_DATA = [
    {
        "stage_num": 1,
        "title": "Stage 1: Day 0 — The Zero-Overhead Launchpad",
        "timeline": "Months 0–3 | TRL 1–2",
        "objective": "Separate cleanly from your employer, validate scientific novelty and unit economics, and establish a low-cost legal identity before spending capital on lawyers or recurring software.",
        "statutory": "Section 27 Indian Contract Act, Udyam MSME, Section 44ADA Income Tax Act & IP Ownership Laws",
        "modules": [
            {
                "num": 1,
                "title": "The Clean Departure, Moonlighting Shield & Personal Runway",
                "lead": "Audit current employment agreements for restrictive non-competes under Section 27, moonlighting limitations, proprietary invention assignment provisions, and dual-employment covenants to guarantee unencumbered IP separation before writing any production code.",
                "tabs": [
                    {
                        "tag": "CONTRACT FORENSICS & IP",
                        "title": "Employment Contract Forensics & Clean-Room IP",
                        "points": [
                            ("Employment Contract Forensics", "Audit current employment agreements for conflict-of-interest, moonlighting restrictions, and IP assignment clauses before writing code or conducting lab tests. Under Section 27 of the Indian Contract Act, post-employment non-compete clauses are generally void, whereas non-solicitation of clients and employees and garden-leave provisions remain enforceable."),
                            ("Clean-Room IP Creation", "Maintain cryptographically timestamped personal logs to demonstrate that early research occurred outside employer hours and without corporate computers, software licenses, or lab facilities.")
                        ]
                    },
                    {
                        "tag": "FINANCIAL RUNWAY & FOUNDERS",
                        "title": "Personal Runway & Co-Founder Matrixing",
                        "points": [
                            ("Personal Runway Architecture", "Structure personal emergency reserves and health insurance to cover roughly 12 months of household burn without drawing a salary."),
                            ("Co-Founder Matrixing & Trial", "Pair domain scientists with systems engineers or commercial operators and run a 3-month technical trial project before formalizing equity splits.")
                        ]
                    }
                ]
            },
            {
                "num": 2,
                "title": "The Featherweight Entity (Udyam + Section 44ADA)",
                "lead": "Avoid premature incorporation costs at TRL 1–2 by registering an instant zero-overhead Sole Proprietorship backed by Udyam MSME and shielded under Section 44ADA presumptive taxation.",
                "tabs": [
                    {
                        "tag": "PHASE A GENESIS",
                        "title": "Phase A Sole Proprietorship & Udyam Shield",
                        "points": [
                            ("Phase A Sole Proprietorship", "Avoid incorporating a Private Limited company at TRL 1–2 where statutory audit and compliance fees drain early cash. Register online in about 15 minutes as a Sole Proprietorship backed by an Udyam Registration (MSME) at zero registration cost."),
                            ("Statutory Cost Savings", "Eliminate upfront ROC filing fees, annual MCA compliance, secretarial audits, and mandatory board resolution paperwork during concept proofing.")
                        ]
                    },
                    {
                        "tag": "TAXATION REGIME",
                        "title": "Section 44ADA Presumptive Taxation Framework",
                        "points": [
                            ("Presumptive Taxation Shield", "Utilize Section 44ADA of the Income Tax Act to shield up to ₹75 Lakhs in early research stipends and technical consulting receipts from complex corporate bookkeeping, declaring a flat 50% presumptive profit margin."),
                            ("Bookkeeping Exemption", "Maintain zero formal maintenance of account books under Section 44AA while retaining 100% statutory legitimacy for banking credit.")
                        ]
                    }
                ]
            },
            {
                "num": 3,
                "title": "The Universal R&D Test & The 70/30 Dual-Track Rule",
                "lead": "Classify true deep-tech applied R&D across industrial sectors and balance long-term radical moonshots with 18-month commercial sub-component survival cashflows.",
                "tabs": [
                    {
                        "tag": "R&D SCOPE & DEFINITION",
                        "title": "Defining Applied R&D Across Core Sectors",
                        "points": [
                            ("Deep-Tech Scope", "Treat infrastructure polymers, biodegradable textiles, agricultural microbials, medical devices, and specialty chemicals as core R&D alongside software and aerospace. Verify that your project builds proprietary 0-to-1 IP that requires patient capital and lab iteration rather than retail arbitrage."),
                            ("Scientific Novelty Validation", "Screen projects against routine engineering tinkering to establish measurable physical or chemical breakthroughs.")
                        ]
                    },
                    {
                        "tag": "BANDWIDTH & REVERSE INCUBATION",
                        "title": "The 70/30 Bandwidth Split & Reverse Incubation",
                        "points": [
                            ("The 70/30 Bandwidth Split", "Allocate 70% of engineering capacity to the 5-year frontier moonshot (e.g., self-healing carbon-negative concrete or mushroom-based leather) and 30% to packaging an intermediate sub-component (e.g., eco-friendly paving bricks, specialized sensors, or simulation tools) to generate B2B survival cash within 18 months."),
                            ("Reverse Incubation Protocol", "Map high-cost supply-chain or manufacturing bottlenecks inside large Indian enterprises before starting lab work so B2B demand exists early.")
                        ]
                    }
                ]
            },
            {
                "num": 4,
                "title": "Prior Art Scraping, First-Principles TEA & Kill-Criteria",
                "lead": "Execute global patent landscape scraping, first-principles techno-economic mass balances, and objective lab kill-criteria to prevent sunk-cost traps.",
                "tabs": [
                    {
                        "tag": "PATENT & PRIOR ART",
                        "title": "Global Prior Art Scraping & Freedom-to-Operate",
                        "points": [
                            ("Global Patent Scraping", "Search WIPO PATENTSCOPE, Google Patents, and Indian Patent Office databases to verify technical novelty and freedom-to-operate before buying equipment."),
                            ("Freedom-to-Operate (FTO) Matrix", "Audit existing claims of domestic and multinational patent holders to map clear white spaces for unencumbered commercial exploitation.")
                        ]
                    },
                    {
                        "tag": "TEA & SCIENTIFIC THRESHOLDS",
                        "title": "First-Principles TEA & Objective Kill-Criteria",
                        "points": [
                            ("Techno-Economic Analysis (TEA)", "Calculate theoretical physical limits, mass balances, energy budgets, and target Bill of Materials (BOM) unit economics at the concept stage to verify commercial viability at scale."),
                            ("Scientific Kill-Criteria", "Set objective lab thresholds (such as thermal stability, yield percentage, or latency limits) to pivot or terminate dead-end projects early rather than falling into sunk-cost traps.")
                        ]
                    }
                ]
            },
            {
                "num": 5,
                "title": "The Zero-SaaS Digital Lab & Data Provenance",
                "lead": "Replace recurring proprietary SaaS suites with local-first Git-versioned documentation, cryptographically signed ELN lab notebooks, and zero-cost static web plumbing.",
                "tabs": [
                    {
                        "tag": "LOCAL-FIRST & LAB PROVENANCE",
                        "title": "Local-First Documentation & Electronic Lab Notebooks",
                        "points": [
                            ("Local-First Documentation", "Replace expensive monthly SaaS subscriptions (Notion, enterprise suites) with local Markdown files, Git version control, and open-source operating systems."),
                            ("Electronic Lab Notebooks (ELN)", "Maintain cryptographically timestamped, reproducible experimental logs to establish invention priority dates and satisfy future institutional technical due diligence.")
                        ]
                    },
                    {
                        "tag": "WEB & PAYMENT PLUMBING",
                        "title": "Static Web Infrastructure & Indian Payment Gateways",
                        "points": [
                            ("Static Web Plumbing", "Deploy fast product documentation and portals using 11ty or Hugo on GitHub Pages at zero hosting cost."),
                            ("Domestic Gateway Plumbing", "Connect native Indian UPI gateways (Getvik, Cashfree) and feedback pipelines (Web3Forms, GitHub issue templates).")
                        ]
                    }
                ]
            },
            {
                "num": 6,
                "title": "Self-Built AI Workflows (Local Models, Prompt Scaffolds & BYOK)",
                "lead": "Deploy local privacy-preserving open-source LLMs, deterministic prompt scaffolds, and serverless BYOK pipelines for automated patent, paper, and regulatory analysis.",
                "tabs": [
                    {
                        "tag": "LOCAL & DETERMINISTIC AI",
                        "title": "Local Privacy-Preserving AI & Prompt Scaffolds",
                        "points": [
                            ("Local Privacy-Preserving AI", "Run quantized open-source models (such as Qwen 2.5 or Llama 3 via Ollama) on local hardware to parse confidential research papers and patents without sending proprietary IP to external cloud servers."),
                            ("Domain-Specific Prompt Scaffolds", "Engineer non-conversational system prompts using explicit context delimiters (BEGININPUT / ENDINPUT / BEGININSTRUCTION) and zero-temperature settings for deterministic extraction in material science, architecture, medical compliance, or code review.")
                        ]
                    },
                    {
                        "tag": "SERVERLESS BYOK AUTOMATION",
                        "title": "BYOK Serverless Automation & Telemetry Radars",
                        "points": [
                            ("BYOK Serverless Automation", "Chain user-owned API keys (Claude, Gemini) through Cloudflare Workers, Python cron scripts, and Supabase to automate literature radars and regulatory checks at minimal cost."),
                            ("Zero-Leakage Telemetry", "Ensure enterprise proprietary source materials and unpublished formulations never enter public model training corpuses.")
                        ]
                    }
                ]
            }
        ]
    },
    {
        "stage_num": 2,
        "title": "Stage 2: The First Prototype — Free Labs & Micro-Grants",
        "timeline": "Months 3–9 | TRL 2–3",
        "objective": "Build and test a working physical or digital prototype using public national laboratories, startup compute credits, and non-dilutive micro-grants prior to equity dilution.",
        "statutory": "I-STEM National Portal, DSIR PRISM Guidelines, NIDHI-PRAYAS Rules & DGFT Customs Notifications",
        "modules": [
            {
                "num": 7,
                "title": "Piggybacking National Labs, I-STEM & Academic Spin-Outs",
                "lead": "Leverage shared sovereign scientific facilities via I-STEM, vet incubators strictly for wet-lab hardware access, and structure royalty-capped academic spin-out licenses.",
                "tabs": [
                    {
                        "tag": "NATIONAL LABS & INCUBATORS",
                        "title": "I-STEM National Facilities & Incubator Vetting",
                        "points": [
                            ("Pay-Per-Use National Facilities", "Book electron microscopes, cleanrooms, wind tunnels, and characterization rigs at IITs, NITs, IISc, CIPET, and CSIR labs via the I-STEM (Indian Science, Technology and Engineering facilities Map) portal instead of buying heavy equipment."),
                            ("Vetting Incubators (TBIs)", "Select Technology Business Incubators strictly for wet-lab infrastructure, specialized testing hardware, and sovereign grant quotas rather than co-working desks.")
                        ]
                    },
                    {
                        "tag": "TTO LICENSING & CRADAS",
                        "title": "TTO Licensing, Faculty Rules & Ring-Fenced CRADAs",
                        "points": [
                            ("TTOs, Faculty Rules & CRADAs", "When spinning out university research, negotiate Technology Transfer Office (TTO) licenses for capped royalties rather than heavy equity dilution. Structure faculty co-founder or advisory equity under university sabbatical and service rules, and use Cooperative Research and Development Agreements (CRADAs) that ring-fence commercial foreground IP."),
                            ("Foreground IP Ring-Fencing", "Contractually secure complete commercial title over all improvements developed during incubator residency.")
                        ]
                    }
                ]
            },
            {
                "num": 8,
                "title": "Unlocking Free Compute, Supercomputing & Legitimate CAD",
                "lead": "Secure cloud infrastructure credits, national PARAM supercomputing allocations, and legitimate startup CAE/CAD licenses to eliminate software audit liabilities.",
                "tabs": [
                    {
                        "tag": "COMPUTE & SUPERCOMPUTING",
                        "title": "Cloud Credits & National Supercomputing Mission",
                        "points": [
                            ("Cloud & Supercomputing Grants", "Apply for startup compute credits across AWS Activate, Google Cloud, Microsoft Founders Hub, and NVIDIA Inception, alongside domestic PARAM supercomputing access under the National Supercomputing Mission (NSM) and IndiaAI Mission for heavy simulation or ML workloads."),
                            ("HPC Workload Optimization", "Utilize subsidized high-performance compute nodes for finite element analysis, computational fluid dynamics, and generative chemistry models.")
                        ]
                    },
                    {
                        "tag": "CAE/CAD LICENSING",
                        "title": "Legitimate Startup CAD/CAE Licensing Architecture",
                        "points": [
                            ("Entrepreneur CAD/CAE Licensing", "Secure official startup licenses for SolidWorks, ANSYS, Autodesk, Altium, and MATLAB to avoid software piracy audits and legal liabilities during Series A due diligence."),
                            ("Compliance Audit Shield", "Maintain verified certificate trails preventing IP clouding from unlicensed design software during institutional diligence.")
                        ]
                    }
                ]
            },
            {
                "num": 9,
                "title": "Prototype Micro-Grants (TRL 1–3)",
                "lead": "Secure non-dilutive sovereign grant funding across DSIR PRISM, NIDHI-PRAYAS, MeitY TIDE 2.0, and SISFS to finance physical proof-of-concept builds.",
                "tabs": [
                    {
                        "tag": "INDIVIDUAL INNOVATOR GRANTS",
                        "title": "DSIR PRISM Proof-of-Concept Financing",
                        "points": [
                            ("Individual Innovator Grants", "Tap DSIR PRISM (Promoting Innovations in Individuals, Startups and MSMEs) to fund TRL 1–2 proof-of-concept studies prior to formal company incorporation."),
                            ("Pre-Incorporation Grant Capital", "Deploy government grant tranches directly to individual inventors for initial hardware fabrication without equity loss.")
                        ]
                    },
                    {
                        "tag": "PHYSICAL PROTOTYPE GRANTS",
                        "title": "NIDHI-PRAYAS, TIDE 2.0 & SISFS Capital Allocation",
                        "points": [
                            ("Physical Prototype Grants", "Apply for NIDHI-PRAYAS (up to ₹10 Lakhs for physical prototypes), the Startup India Seed Fund Scheme (SISFS), and MeitY TIDE 2.0 through partnered incubators without giving up equity."),
                            ("Milestone-Gated Tranches", "Structure experimental procurement and test milestones to accelerate second-tranche disbursements.")
                        ]
                    }
                ]
            },
            {
                "num": 10,
                "title": "Customs Survival, Duty Waivers & Rapid Prototyping",
                "lead": "Navigate DGFT import classifications, MOOWR bonded duty waivers, ATA Carnet international testing, and design-for-manufacturing (DFM) micro-batch tooling.",
                "tabs": [
                    {
                        "tag": "CUSTOMS & DUTY WAIVERS",
                        "title": "IEC, HSN Codes, DSIR Waivers & MOOWR Scheme",
                        "points": [
                            ("IEC, HSN Codes & Duty Waivers", "Obtain a DGFT Import-Export Code (IEC) and classify specialized sensors, reagents, and components under exact HSN codes to prevent port holds. Use DSIR customs duty exemption certificates and the MOOWR (Manufacturing and Other Operations in Warehouse Regulations) scheme to defer or waive import duties on R&D inputs."),
                            ("ATA Carnet & Repair Re-Imports", "Use ATA Carnets for duty-free temporary export of prototypes to international trade shows or foreign pilots, and invoke customs re-import notifications to bring defective exported hardware back to India for RMA repair without double taxation.")
                        ]
                    },
                    {
                        "tag": "RAPID PROTOTYPING & DFM",
                        "title": "Micro-Batch Tooling & DFM/DFA/DFT Methodologies",
                        "points": [
                            ("Micro-Batch Tooling & DFM/DFA/DFT", "Negotiate low Minimum Order Quantities (MOQs) with domestic MSME machine shops, PCB houses, and textile mills. Design prototypes using standard tolerances and test jigs (Design for Manufacturing, Assembly, and Testing) to ease domestic mass production later."),
                            ("Jig & Fixture Standardization", "Develop repeatable test fixtures early to validate unit reliability across pilot batches.")
                        ]
                    }
                ]
            }
        ]
    },
    {
        "stage_num": 3,
        "title": "Stage 3: The Trigger Wire — Incorporation, Team & IP Lock",
        "timeline": "Months 9–15 | TRL 3–4",
        "objective": "Transition to an institutional corporate structure when crossing liability, hiring, or grant thresholds, while locking down co-founder vesting and physical/legal IP defenses.",
        "statutory": "Companies Act 2013 (Section 2(68)), Startup India 80-IAC, Patents Act 1970 (Form 18A), National Biodiversity Authority (NBA)",
        "modules": [
            {
                "num": 11,
                "title": "Crossing the Trigger Wire (Pvt. Ltd., DPIIT & 80-IAC)",
                "lead": "Identify the exact liability and capital triggers to incorporate a Private Limited company, secure DPIIT startup recognition, and lock in Section 80-IAC tax exemption.",
                "tabs": [
                    {
                        "tag": "INCORPORATION TRIGGERS",
                        "title": "The Three Trigger Wires & Private Limited Incorporation",
                        "points": [
                            ("The Three Trigger Wires", "Upgrade from a Sole Proprietorship when (1) signing commercial contracts with liability above ₹10 Lakhs, (2) hiring your first full-time non-founder employee, or (3) accepting external equity or corporate-mandated sovereign grants."),
                            ("Private Limited Incorporation", "Incorporate under Section 2(68) of the Companies Act, 2013. Avoid LLPs (which complicate ESOPs and CCPS venture rounds) and Section 8 NGOs/Trusts (which prohibit dividend distribution, carry pools, and equity exits). Maintain active Class-3 DSCs and complete annual DIR-3 KYC filings to prevent DIN deactivation and ₹5,000 late penalties.")
                        ]
                    },
                    {
                        "tag": "DPIIT & TAX HOLIDAY",
                        "title": "DPIIT Recognition & Section 80-IAC 3-Year Tax Holiday",
                        "points": [
                            ("DPIIT Recognition & Deep-Tech Term", "Register on the NSWS/Startup India portal for DPIIT Startup Recognition (which covers entities up to 10 years old—and up to 20 years with ₹300 Crore turnover limits for deep-tech startups) to unlock self-certified labor/environmental compliance."),
                            ("Section 80-IAC Tax Exemption", "Apply for Section 80-IAC (a 3-year 100% corporate tax holiday within the first 10 years of incorporation) before the Inter-Ministerial Board.")
                        ]
                    }
                ]
            },
            {
                "num": 12,
                "title": "The Co-Founder Pre-Nup & Cap Table Physics",
                "lead": "Enforce 4-year reverse vesting with 1-year cliffs, define leaver equity buyback formulas, and codify protective founder affirmative voting rights inside the Articles of Association.",
                "tabs": [
                    {
                        "tag": "VESTING & CLIFFS",
                        "title": "Founders Agreement, 4-Year Vesting & Leaver Mechanics",
                        "points": [
                            ("Vesting & Cliffs", "Avoid unconditional 50/50 day-one equity splits. Execute a legally binding Founders' Agreement with a 4-year vesting schedule and a 1-year cliff, paired with clear good-leaver and bad-leaver buyback formulas so departing co-founders cannot walk away with dead equity."),
                            ("Dead Equity Prevention", "Empower the remaining founders to repurchase unvested shares at par value upon premature co-founder departure.")
                        ]
                    },
                    {
                        "tag": "AOA PROTECTIONS",
                        "title": "Articles of Association (AoA) Affirmative Voting Rights",
                        "points": [
                            ("AoA Affirmative Rights", "Codify founder veto rights and affirmative voting protections inside the Articles of Association (AoA) to protect long-term scientific direction against early investor pressure."),
                            ("Scientific Autonomy Covenant", "Ring-fence core R&D decision-making and product pivot vetoes from non-technical shareholders.")
                        ]
                    }
                ]
            },
            {
                "num": 13,
                "title": "The Provisional Patent Playbook, Form 18A & Special IP Regimes",
                "lead": "Lock priority dates via provisional patents, accelerate examination to 8 months via Form 18A, leverage PCT international phases, and clear NBA biological approvals.",
                "tabs": [
                    {
                        "tag": "PATENTS & EXPEDITED EXAM",
                        "title": "Provisional Filing, Complete Claims & Form 18A Fast-Track",
                        "points": [
                            ("Provisional to Complete Specification", "File an MSME/Startup Provisional Patent (costing ~₹1,600 in government filing fees) to lock in a 12-month global priority date before showing prototypes to corporate buyers. Follow up within 12 months with a Complete Specification containing broad independent claims and narrow dependent claims."),
                            ("Expedited Examination & PCT", "File Form 18A (available to DPIIT Startups, MSMEs, and female co-applicants) to compress Indian patent examination from several years down to roughly 8–12 months, and use the SIPP scheme for government-subsidized patent facilitators. Use PCT (Patent Cooperation Treaty) filings to delay expensive US/EU/Japan national phase fees by up to 30 months while validating commercial demand.")
                        ]
                    },
                    {
                        "tag": "SPECIALIZED IP REGIMES",
                        "title": "National Biodiversity Authority, Plant Varieties & Topographies",
                        "points": [
                            ("National Biodiversity Authority Approval", "Obtain mandatory National Biodiversity Authority (NBA Form III) approval before filing patents involving Indian biological resources."),
                            ("Novel Regimes (PPV&FRA, Designs, SICLD)", "Register novel seeds and microbial strains under the PPV&FRA Act, physical aesthetics under Industrial Designs, and chip layouts under the SICLD Act.")
                        ]
                    }
                ]
            },
            {
                "num": 14,
                "title": "Trade Secrets, Hardware Anti-Tamper & Lab OpSec",
                "lead": "Protect unpatentable formulations through trade secrets, implement physical hardware anti-tamper measures, enforce PIIAs, and audit open-source licenses.",
                "tabs": [
                    {
                        "tag": "TRADE SECRETS & HARDWARE OPSEC",
                        "title": "Trade Secret Architecture & Physical Anti-Tamper",
                        "points": [
                            ("Trade Secrets vs. Patents", "Patent hardware and products that can be reverse-engineered when sold; keep chemical synthesis temperatures, catalyst ratios, internal manufacturing rigs, and backend algorithms as undisclosed Trade Secrets so you do not publish a blueprint for competitors."),
                            ("Physical Anti-Tamper & Air-Gapping", "Scrub IC part numbers off PCBs, encapsulate sensitive electronics in opaque epoxy potting, enable microcontroller firmware read-out protection and encrypted bootloaders, and isolate lab testing networks from public internet access.")
                        ]
                    },
                    {
                        "tag": "PIIA & LICENSE HYGIENE",
                        "title": "Proprietary Information Agreements (PIIA) & FOSS Audits",
                        "points": [
                            ("PIIA & Assignment Hygiene", "Require every co-founder, intern, thesis student, and contractor to sign a Proprietary Information and Inventions Agreement (PIIA) vesting all code, CAD files, and discoveries in the company."),
                            ("Copyleft License Quarantine", "Audit software and firmware repositories to avoid viral copyleft licenses (such as GPLv3) that force public disclosure of proprietary source code.")
                        ]
                    }
                ]
            },
            {
                "num": 15,
                "title": "Bootstrapped Talent, The 100-Point Carry Pool & Apprenticeships",
                "lead": "Attract top-tier scientific talent with synthetic carry pools and ESOPs, tap NAPS/NATS stipend reimbursements, and ensure compliance across EPFO/ESIC and PoSH.",
                "tabs": [
                    {
                        "tag": "INCENTIVES & CARRY POOLS",
                        "title": "The 100-Point Synthetic Carry Pool, ESOPs & Sweat Equity",
                        "points": [
                            ("The 100-Point Synthetic Carry Pool & ESOPs", "Attract specialized engineers without competing with big-tech cash salaries by issuing contractually enforceable Phantom Equity (a synthetic carry pool sharing exit or project profits without voting dilution) or a formal ESOP pool with staggered strike prices, alongside Section 54 Sweat Equity for domain experts contributing hard IP."),
                            ("Tax-Efficient ESOP Architecture", "Structure ESOP vesting and exercise triggers to optimize employee perquisite tax events under Indian income tax rules.")
                        ]
                    },
                    {
                        "tag": "TALENT SUBSIDIES & STATUTORY HR",
                        "title": "NAPS/NATS Apprenticeships & Statutory Headcount Triggers",
                        "points": [
                            ("Government-Subsidized Talent Pipelines", "Utilize NAPS (National Apprenticeship Promotion Scheme) and NATS (National Apprenticeship Training Scheme) for government stipend reimbursements on diploma/graduate technicians, recruit PhD fellows via industrial thesis partnerships and PM Fellowships, and hire CAD/regulatory specialists on milestone-gated contractor agreements."),
                            ("Early HR & Visa Hygiene", "Enforce NDAs, non-solicitation clauses, and PoSH (Prevention of Sexual Harassment) committees, track headcount triggers for EPFO (20 employees) and ESIC (10 employees), and manage Employment Visas/FRRO rules for foreign or NRI scientists.")
                        ]
                    }
                ]
            }
        ]
    },
    {
        "stage_num": 4,
        "title": "Stage 4: Commercial Survival — Cracking Enterprise Pilots",
        "timeline": "Months 15–24 | TRL 4–5",
        "objective": "Overcome the 'Guinea Pig Problem' by selling your 30% sub-component, charging for custom engineering, and enforcing statutory MSME payment protections.",
        "statutory": "MSMED Act 2006, Section 43B(h) Income Tax Act, GeM Startup Guidelines, CDSCO CTRI Regulations",
        "modules": [
            {
                "num": 16,
                "title": "Packaging the 30% Sub-Component, NRE Contracts & HaaS",
                "lead": "Productize intermediate sub-components for rapid B2B deployment, charge for enterprise pilot adaptations through NRE contracts, and deploy Hardware-as-a-Service models.",
                "tabs": [
                    {
                        "tag": "SUB-COMPONENT PACKAGING",
                        "title": "Productizing the 30% Component for Industrial Buyers",
                        "points": [
                            ("Productizing the 30% Component", "Carve out an internal sensor, material additive, calibration rig, or software module from your core R&D and price it around Total Cost of Ownership (TCO) savings, yield improvements, or downtime reduction for industrial buyers."),
                            ("Commercial Validation Sandbox", "Use early sub-component enterprise revenues to fund long-lead lab iterations without venture dilution.")
                        ]
                    },
                    {
                        "tag": "NRE & HAAS MODELS",
                        "title": "Non-Recurring Engineering (NRE) & Hardware-as-a-Service",
                        "points": [
                            ("Refusing Free PoCs (NRE & HaaS)", "Avoid unpaid Proof-of-Concept traps by structuring Non-Recurring Engineering (NRE) contracts where the enterprise pays for custom adaptation and testing time. When enterprise CapEx budgets are frozen, offer Hardware-as-a-Service (HaaS) or pay-per-use OpEx leasing."),
                            ("Contractual Upfront Financing", "Secure 40–50% upfront NRE milestones to fund tooling, specialized sensors, and pilot technician hours.")
                        ]
                    }
                ]
            },
            {
                "num": 17,
                "title": "Pre-Clinical, Field Trial & Biosafety Clearances (New Expanded Module)",
                "lead": "Secure approvals across IBSC, RCGM, and GEAC for biological applications, CPCSEA for animal studies, and CDSCO/CTRI registrations for human clinical evaluations.",
                "tabs": [
                    {
                        "tag": "BIOSAFETY & PRE-CLINICAL",
                        "title": "IBSC, RCGM, GEAC & CPCSEA Regulatory Clearances",
                        "points": [
                            ("Pre-Clinical & Biosafety Gateways", "Before testing biological, agricultural, or medical innovations outside the lab, secure approvals from the Institutional Biosafety Committee (IBSC), RCGM (Review Committee on Genetic Manipulation), and GEAC for synthetic biology/enzymes, or CPCSEA for pre-clinical animal studies."),
                            ("Contained Testing Compliance", "Adhere to strict biosafety level (BSL-2/3) protocols before environmental release or agricultural field trials.")
                        ]
                    },
                    {
                        "tag": "CLINICAL TRIALS",
                        "title": "Human Clinical Trials, IEC & CTRI Registration",
                        "points": [
                            ("Human Clinical Trials", "Register human device or diagnostic protocols with Institutional Ethics Committees (IEC) and the Clinical Trials Registry-India (CTRI) under CDSCO oversight, backed by clinical trial indemnity insurance."),
                            ("Data Integrity Assurance", "Maintain Good Clinical Practice (GCP) compliant audit dossiers for domestic market authorization and CE/FDA filings.")
                        ]
                    }
                ]
            },
            {
                "num": 18,
                "title": "Cracking Government, PSU & Defense Tenders (GeM & Make in India)",
                "lead": "Leverage GeM startup exemptions for EMD and prior turnover, calculate domestic Class-I local supplier value addition, and bid on public tenders reserved for Indian startups.",
                "tabs": [
                    {
                        "tag": "GEM STARTUP RELAXATIONS",
                        "title": "Government e-Marketplace (GeM) Tender Exemptions",
                        "points": [
                            ("GeM Startup Relaxations", "Register on the Government e-Marketplace (GeM) using your DPIIT Startup and Udyam certificates to claim statutory Earnest Money Deposit (EMD) waivers and exemptions from 'prior turnover' and 'prior experience' criteria in public tenders."),
                            ("Direct Purchase Thresholds", "Utilize GeM direct purchase thresholds and L1 competitive bidding tailored specifically for registered domestic innovations.")
                        ]
                    },
                    {
                        "tag": "MAKE IN INDIA ADVANTAGE",
                        "title": "Class-I Local Supplier Status (>50% Domestic Value Addition)",
                        "points": [
                            ("Class-I Local Supplier Advantage", "Calculate domestic Bill of Materials value addition (typically greater than 50% for Class-I Local Suppliers) under the Make in India Public Procurement Order to bid on tenders reserved for indigenous manufacturers."),
                            ("Public Procurement Preference", "Secure statutory purchase preference over foreign equipment vendors across PSU and military procurement.")
                        ]
                    }
                ]
            },
            {
                "num": 19,
                "title": "Enterprise Procurement Survival, Escrow & MSME Samadhaan",
                "lead": "Protect intellectual property with source-code/CAD escrows, cap commercial liabilities, and enforce statutory 45-day payment cycles via MSME Samadhaan and Section 43B(h).",
                "tabs": [
                    {
                        "tag": "CONTRACTUAL DEFENSES",
                        "title": "Liability Caps, Background IP & CAD/Source Escrow",
                        "points": [
                            ("Contractual Guardrails", "Cap commercial liability to the contract value, separate Pre-Existing (Background) IP from Foreground IP, limit liquidated damages, and use Source-Code/CAD Escrow agreements to satisfy enterprise continuity demands without handing over raw blueprints."),
                            ("Warranties & Indemnities", "Exclude consequential and indirect damages while defending proprietary algorithms against enterprise lock-in.")
                        ]
                    },
                    {
                        "tag": "PAYMENT ENFORCEMENT",
                        "title": "MSME Samadhaan & Section 43B(h) Compound Interest",
                        "points": [
                            ("Weaponizing MSME Samadhaan & Section 43B(h)", "Include your Udyam registration number on every tax invoice. Under the MSMED Act and Section 43B(h) of the Income Tax Act, corporate buyers must pay MSME suppliers within 45 days (or 15 days without a written agreement) to deduct that expense in their own tax filings, and delayed invoices accrue mandatory compound interest at 3x the RBI bank rate via the MSME Samadhaan portal."),
                            ("Statutory Audit Scrutiny", "Leverage mandatory corporate disclosures in CARO and balance sheet notes regarding delayed MSME payables.")
                        ]
                    }
                ]
            },
            {
                "num": 20,
                "title": "IP Licensing, Whitepapers & Technical Distribution",
                "lead": "Structure joint ventures and technology-transfer licenses with minimum royalty floors, establish technical authority via BIS standards, and deploy Field Application Engineers.",
                "tabs": [
                    {
                        "tag": "LICENSING & ROYALTIES",
                        "title": "Royalty Agreements, Minimum Floors & Joint Ventures",
                        "points": [
                            ("Royalty & Joint Venture Models", "License patented polymers, chemical blends, or hardware designs to high-volume manufacturers using contracts with upfront tech-transfer fees and minimum annual royalty floors."),
                            ("Audit Rights & Geographic Restraints", "Embed statutory audit clauses to inspect licensee manufacturing books and restrict sales to approved regional markets.")
                        ]
                    },
                    {
                        "tag": "TECHNICAL DISTRIBUTION",
                        "title": "BIS Standards Committees, Benchmark Whitepapers & FAEs",
                        "points": [
                            ("Technical Authority & FAEs", "Publish reproducible benchmark whitepapers and application notes targeted at chief engineers, participate in BIS technical standards committees and CII/FICCI working groups, and deploy Field Application Engineers (FAEs) and industrial system integrators to embed your product into client lines."),
                            ("Industry Standard Embedding", "Co-author Bureau of Indian Standards (BIS) specifications to establish statutory regulatory moats.")
                        ]
                    }
                ]
            }
        ]
    },
    {
        "stage_num": 5,
        "title": "Stage 5: Scaling the Machine — Heavy Grants, Homologation & Manufacturing",
        "timeline": "Years 2–3 | TRL 5–6",
        "objective": "Tap multi-crore sovereign R&D capital, secure industrial zoning and regulatory homologation, monetize sustainability metrics, and scale domestic manufacturing.",
        "statutory": "ANRF Act 2023, Factories Act 1948, SPCB Environmental Norms, BIS/WPC/CDSCO Homologation, SCOMET Regulations",
        "modules": [
            {
                "num": 21,
                "title": "The Multi-Crore Sovereign Playbook (ANRF RDI Fund, iDEX, Ministries & States)",
                "lead": "Access multi-crore patient capital via the ANRF ₹1 Lakh Crore RDI Fund, secure defense and ministry grant tranches, and establish recognized DSIR in-house R&D units.",
                "tabs": [
                    {
                        "tag": "SOVEREIGN CAPITAL & ANRF",
                        "title": "The ANRF ₹1 Lakh Crore RDI Fund (TRL 4+) & SLFMs",
                        "points": [
                            ("The ANRF ₹1 Lakh Crore RDI Fund (TRL 4+)", "Once lab validation reaches TRL 4+, apply for patient capital (long-term low-interest concessional loans or equity covering up to 50% of assessed project cost) under the ANRF Research, Development and Innovation (RDI) Fund. Applications route through empanelled Second-Level Fund Managers (SLFMs)—including TDB, BIRAC, IIT Research Parks, and registered Deep-Tech AIFs—and require covenants keeping generated IP and corporate control domiciled in India."),
                            ("Defense, Ministry & Bilateral Grants", "Target iDEX (DISC/Prime) and DRDO TDF for defense tech; BIRAC BIG/SBIRI (Biotech), NTTM (Technical Textiles), MoRTH (Highways/Materials), MNRE (Clean Energy), and RKVY-RAFTAAR (Agri-Tech); TDB commercialization debt; GITA bilateral grants (Indo-Israel/UK/US); Schedule VII CSR funds via academic incubators; and State Startup Policies (Karnataka Elevate, Gujarat Startup Policy, TANSEED) for rent, patent, and power subsidies.")
                        ]
                    },
                    {
                        "tag": "DSIR LAB & PFMS AUDITS",
                        "title": "DSIR In-House R&D Recognition & PFMS Grant Audits",
                        "points": [
                            ("DSIR Recognition & PFMS Audits", "Register your corporate lab as a DSIR In-House R&D Unit and manage dedicated escrow bank accounts, PFMS (Public Financial Management System) eat-modules, and Utilization Certificates (UCs) to pass government grant audits cleanly."),
                            ("Duty-Free Capital Procurement", "Utilize DSIR customs and excise exemption certificates to import high-end analytical equipment at zero tariff.")
                        ]
                    }
                ]
            },
            {
                "num": 22,
                "title": "Industrial Zoning, Factories Act & Lab Safety Clearances",
                "lead": "Transition into notified industrial estates (GIDC, MIDC, KIADB), obtain SPCB consent and PESO clearances, and manage statutory compliance under the Factories Act, 1948.",
                "tabs": [
                    {
                        "tag": "INDUSTRIAL ESTATES & POWER",
                        "title": "Notified Industrial Estates & High-Tension Subsidies",
                        "points": [
                            ("Industrial Estate Leasing", "Lease fabrication and pilot labs inside notified industrial estates (GIDC, MIDC, KIADB) rather than commercial/retail properties to avoid municipal eviction, and secure sanctioned 3-phase high-tension power loads with industrial tariff rebates."),
                            ("Zoning Compliance Mandates", "Avoid municipal zoning violations that lead to immediate lab sealing or environmental disconnection orders.")
                        ]
                    },
                    {
                        "tag": "FACTORIES ACT & SAFETY",
                        "title": "Factories Act, 1948, SPCB CTE/CTO, PESO & AERB Clearances",
                        "points": [
                            ("Factories Act & Hazardous Clearances", "Manage the transition from the Shops & Establishments Act to the Factories Act, 1948 when headcount reaches 10 workers (with power) or 20 workers (without power). Obtain SPCB Consent to Establish/Operate, PESO licenses for pressurized gases/energetics, and AERB clearances for radiation/X-ray/laser equipment while maintaining NABL (ISO/IEC 17025) instrument calibration."),
                            ("Environmental Effluent Treatment", "Construct Zero Liquid Discharge (ZLD) or tied Common Effluent Treatment Plant (CETP) channels to pass pollution audits.")
                        ]
                    }
                ]
            },
            {
                "num": 23,
                "title": "Sector-Specific Homologation & Export Controls",
                "lead": "Clear statutory certifications across BIS CRS, WPC, CDSCO, ARAI, and DGCA, alongside global clearances (CE, FCC, FDA) and DGFT SCOMET dual-use export authorizations.",
                "tabs": [
                    {
                        "tag": "DOMESTIC HOMOLOGATION",
                        "title": "BIS, WPC, CDSCO, ARAI, DGCA & Sector Certifications",
                        "points": [
                            ("Domestic Statutory Certifications", "Clear BIS CRS / ISI marks and EMI/EMC tests for electronics; WPC ETA and TEC MTCTE for wireless/telecom; CDSCO Class A–D and ISO 13485 for medical devices; FSSAI for novel foods; ARAI/iCAT/NATRAX for automotive; DGCA Type Certification for drones; IN-SPACe for space tech; CPWD/IRC/RDSO empanelment for civil infrastructure materials; and BEE, LMPC, and EPR (Extended Producer Responsibility) for energy, packaging, and e-waste/battery compliance."),
                            ("Mandatory Homologation Testing", "Submit production units to accredited test agencies to secure legal sale clearance in the Indian union.")
                        ]
                    },
                    {
                        "tag": "GLOBAL EXPORT CONTROLS",
                        "title": "DGFT SCOMET Authorization & Global Standards (CE/FCC/FDA)",
                        "points": [
                            ("Software & Global Export Clearances", "Implement DPDP Act privacy controls, CERT-In norms, and ISO 27001; utilize RBI/SEBI/IRDAI regulatory sandboxes; and secure DGFT SCOMET dual-use export licenses alongside CE (Europe), FCC/UL/FDA (US), and RoHS/REACH compliance for global sales alongside RoDTEP and EPCG export incentives."),
                            ("Dual-Use SCOMET Compliance", "Audit precision avionics, autonomous navigation algorithms, and specialized chemicals against DGFT non-proliferation schedules.")
                        ]
                    }
                ]
            },
            {
                "num": 24,
                "title": "Sustainability, LCA & Carbon Monetization",
                "lead": "Execute ISO 14040 Life Cycle Assessments, secure eco-labels, register carbon credits under the Indian Carbon Market (CCTS), and format Scope 3 data for client BRSR disclosures.",
                "tabs": [
                    {
                        "tag": "LCA & ECO-LABELS",
                        "title": "ISO 14040/14044 LCA & GreenPro/Ecomark Certifications",
                        "points": [
                            ("Life Cycle Assessment & Eco-Labels", "Conduct ISO 14040 / 14044 cradle-to-gate Life Cycle Assessments (LCA) and secure GreenPro, Ecomark, or OEKO-TEX certifications so sustainable materials and textiles command institutional premiums."),
                            ("Third-Party Verified Baseline", "Quantify embodied energy, raw-material footprint, and water consumption to validate genuine green claims.")
                        ]
                    },
                    {
                        "tag": "CARBON CREDITS & SCOPE 3",
                        "title": "Indian Carbon Market (CCTS), Verra & BRSR Integration",
                        "points": [
                            ("Carbon Markets & Scope 3 Reporting", "Register carbon-negative processes under the Indian Carbon Market (CCTS), Verra, or Gold Standard to issue tradable carbon credits, and format environmental data so enterprise clients can claim Scope 3 emission reductions in their statutory SEBI BRSR filings."),
                            ("Enterprise ESG Integration", "Monetize statutory sustainability reporting requirements of top-1,000 listed Indian corporate buyers.")
                        ]
                    }
                ]
            },
            {
                "num": 25,
                "title": "Manufacturing Scale-Up, Tooling Ownership & Field RMA",
                "lead": "Model contract manufacturing breakevens, safeguard legal title to custom tooling and injection molds, and execute HALT/HASS stress testing against extreme Indian environments.",
                "tabs": [
                    {
                        "tag": "TOOLING & EMS AGREEMENTS",
                        "title": "EMS Contracts, Tooling Ownership & Quality Assurance",
                        "points": [
                            ("Contract Manufacturing vs. Pilot Lines", "Model the breakeven volume between outsourcing to Electronics Manufacturing Services (EMS) / contract manufacturers versus running an in-house micro-factory."),
                            ("Tooling Ownership & QA/QC", "Draft manufacturing agreements so the startup retains legal title to custom injection molds, dies, and test jigs housed at vendor plants, backed by 'Golden Samples', Incoming Quality Control (IQC), Statistical Process Control (SPC), ISO 9001, and dual-sourced critical components.")
                        ]
                    },
                    {
                        "tag": "STRESS TESTING & FIELD RMA",
                        "title": "ALT / HALT Stress Testing, Buffers & RMA Infrastructure",
                        "points": [
                            ("Indian Environmental Stress Testing & RMA", "Run Accelerated Life Testing (ALT) and HALT/HASS against extreme Indian heat, dust, monsoon humidity, and grid voltage spikes. Build spare-part buffers, Return Merchandise Authorization (RMA) workflows, and Product Liability / E&O / D&O insurance."),
                            ("Warranty Reserve Accounting", "Maintain audited warranty reserve funds to service field replacements without cashflow disruption.")
                        ]
                    }
                ]
            }
        ]
    },
    {
        "stage_num": 6,
        "title": "Stage 6: Institutional Readiness — Forensic Books, Crisis Survival & Series A Bridge",
        "timeline": "Year 3 | TRL 6+",
        "objective": "Maintain forensic-grade financial hygiene, survive regulatory or IP shocks, and structure institutional capital raises or Firm X integration.",
        "statutory": "CARO 2020, Ind AS 38, Income Tax Act (Section 35, 115BBF), Companies Act 2013 (Section 248 C-PACE), FEMA Regulations",
        "modules": [
            {
                "num": 26,
                "title": "Forensic Accounting, R&D Tax Shields & The 10% Patent Box",
                "lead": "Structure dedicated treasury and foreign remittance accounts, claim Section 35 R&D write-offs, and utilize the Section 115BBF 10% concessional patent box tax regime.",
                "tabs": [
                    {
                        "tag": "TREASURY & REMITTANCE",
                        "title": "Current Account Hygiene, EEFC & Form 15CA/15CB",
                        "points": [
                            ("Banking, Treasury & Founder Payouts", "Operate strictly through dedicated Current Accounts with clean voucher trails. Park idle grant or seed tranches in overnight liquid funds or auto-sweep FDs (where grant rules permit), manage EEFC accounts and e-BRC realizations for exports, and structure founder payouts cleanly across Section 192 salary or Section 194J professional fees."),
                            ("Export Realization Tracking", "Reconcile foreign inflow certificates via EDPMS to avoid RBI penal notices on overseas collections.")
                        ]
                    },
                    {
                        "tag": "PATENT BOX & TAX SHIELDS",
                        "title": "Section 115BBF 10% Concessional Patent Tax & Section 35",
                        "points": [
                            ("GST, Section 35 & Section 115BBF Patent Box", "Claim GST Input Tax Credit (ITC) on lab machinery, file inverted duty structure refunds and export LUTs, and remit TDS and Form 15CA/15CB on foreign software/testing payouts. Utilize Section 35 scientific research deductions and the Section 115BBF Indian Patent Box regime, which taxes royalty income from patents developed and registered in India at a concessional 10% rate."),
                            ("Inverted Duty Refund Recovery", "Automate GST portal refunds where raw material inputs attract higher duty rates than manufactured goods.")
                        ]
                    }
                ]
            },
            {
                "num": 27,
                "title": "Audit Hygiene (CARO 2020 & Ind AS 38)",
                "lead": "Apply Ind AS 38 intangible asset capitalization rules and prepare books for rigorous CARO 2020 institutional statutory audit checklists.",
                "tabs": [
                    {
                        "tag": "IND AS 38 CAPITALIZATION",
                        "title": "Research vs. Development Phase Expense Capitalization",
                        "points": [
                            ("R&D Capitalization vs. Expensing", "Apply Ind AS 38 (Intangible Assets) to separate early research-phase expenses (booked to the P&L) from development-phase intangible assets (capitalized on the Balance Sheet once technical and commercial feasibility is demonstrated)."),
                            ("Balance Sheet Asset Creation", "Document six Ind AS 38 criteria to legitimately capitalize prototype tooling, direct salaries, and validation expenses.")
                        ]
                    },
                    {
                        "tag": "CARO 2020 AUDIT READINESS",
                        "title": "CARO 2020 Red Flag Scrubbing & Related-Party Cleanliness",
                        "points": [
                            ("CARO 2020 Readiness", "Eliminate forensic red flags before institutional due diligence by documenting arm's-length Related Party Transactions (RPTs), maintaining physical inventory/asset verification logs, and clearing statutory dues on time."),
                            ("Forensic Auditor Verification", "Ensure internal controls over financial reporting (ICFR) withstand Big 4 diligence scrutiny.")
                        ]
                    }
                ]
            },
            {
                "num": 28,
                "title": "Non-Dilutive Debt, Deep-Tech Valuation & Term Sheet Forensics",
                "lead": "Access collateral-free CGTMSE loans and venture debt, price IP rounds via CCPS and iSAFE instruments, and negotiate balanced term sheet liquidation preferences.",
                "tabs": [
                    {
                        "tag": "VENTURE DEBT & LEASING",
                        "title": "SIDBI, CGTMSE, TReDS & Equipment Leasing",
                        "points": [
                            ("Venture Debt & Equipment Leasing", "Access SIDBI venture debt, CGTMSE collateral-free MSME loans, TReDS invoice discounting, and asset-backed equipment leases for CNCs/spectrometers/GPUs while avoiding personal guarantees by founders."),
                            ("Non-Dilutive Working Capital", "Finance production orders and long-cycle receivables without forfeiting equity percentages.")
                        ]
                    },
                    {
                        "tag": "VALUATION & TERM SHEETS",
                        "title": "CCPS/iSAFE, FEMA FC-GPR & Term Sheet Covenants",
                        "points": [
                            ("CCPS, iSAFE & Dual Valuation Compliance", "Price pre-revenue IP and TRL milestones using CCPS (Compulsorily Convertible Preference Shares) or iSAFE notes. Reconcile Discounted Cash Flow (DCF) valuations across both RBI FEMA pricing norms and Income Tax Fair Market Value rules."),
                            ("Term Sheet & FEMA/HoldCo Mechanics", "Negotiate 1x non-participating liquidation preferences, broad-based weighted-average anti-dilution, and balanced ROFR/tag-along/drag-along clauses. Navigate FEMA FC-GPR filings, Press Note 3 restrictions, ODI rules, and Section 80M inter-corporate dividend deductions while avoiding the RBI 50-50 unregistered NBFC trap.")
                        ]
                    }
                ]
            },
            {
                "num": 29,
                "title": "Crisis Management, Litigation & Black-Swan Survival (New Expanded Module)",
                "lead": "Survive customs seizures, mount patent invalidity defenses against IP trolls, manage field product recalls, and resolve co-founder deadlocks cleanly.",
                "tabs": [
                    {
                        "tag": "CUSTOMS SEIZURES & IP DEFENSE",
                        "title": "Port Detention Bonds & Patent Litigation Defenses",
                        "points": [
                            ("Customs Seizures & IP Litigation", "Resolve port seizures and show-cause notices via provisional duty bonds and technical HSN justifications. Counter competitor patent cease-and-desist letters or IP trolls using prior-art invalidity searches, pre-grant oppositions, and documented design-arounds."),
                            ("Pre-Grant Opposition Playbook", "Challenge predatory competitor patent filings before the Indian Patent Office using documented prior-art citations.")
                        ]
                    },
                    {
                        "tag": "CRISIS & DEADLOCK SALVAGE",
                        "title": "Product Recalls, Shotgun Buybacks & Force Majeure",
                        "points": [
                            ("Recalls, Co-Founder Deadlocks & Force Majeure", "Execute statutory containment and PR protocols for field failures or lab incidents; resolve co-founder deadlocks via mediation, arbitration, or shotgun buyback clauses without halting lab operations; and invoke force majeure or alternate vendor qualifications during semiconductor/raw-material embargoes."),
                            ("Supply Chain Continuity Plans", "Qualify domestic secondary suppliers to withstand international trade embargoes or geopolitical shocks.")
                        ]
                    }
                ]
            },
            {
                "num": 30,
                "title": "Governance, M&A, C-PACE Salvage & The Graduation Audit",
                "lead": "Maintain secretarial compliance (SS-1/SS-2), structure clean strategic M&A or C-PACE winding up if experimental trials stall, and pass the 3-Year Graduation Audit.",
                "tabs": [
                    {
                        "tag": "SECRETARIAL & CLEAN EXIT",
                        "title": "Secretarial Standards, Strategic M&A & C-PACE Salvage",
                        "points": [
                            ("Board Hygiene, M&A & Secondaries", "Maintain Secretarial Standards (SS-1/SS-2), board minutes, and ROC filings (MGT-7, AOC-4). Structure monthly investor updates, prepare data rooms for strategic M&A or conglomerate joint ventures, and arrange partial founder secondary share sales at Series A/B for personal liquidity."),
                            ("Clean Winding-Up (C-PACE) & IP Salvage", "If an experimental company fails, transfer or license out residual IP cleanly and wind up the entity via Section 248 Fast Track Exit (C-PACE) so founders avoid a 5-year director disqualification under Section 164(2).")
                        ]
                    },
                    {
                        "tag": "GRADUATION AUDIT & FIRM X",
                        "title": "Founder Resilience & The 3-Year Graduation Audit",
                        "points": [
                            ("Founder Resilience & Ethics", "Enforce lab protocols against data fabrication, manage dual-use ethics and stealth-mode timing."),
                            ("The 3-Year Graduation Audit", "Pass the 3-Year Graduation Audit (TRL 6+, defended IP, CARO-clean books, and repeatable B2B revenue) to qualify for institutional Series A capital or Firm X integration.")
                        ]
                    }
                ]
            }
        ]
    }
]

def build_tree_nodes():
    nodes = []
    # Overall Curriculum overview
    nodes.append("""          <!-- Overall Curriculum Overview -->
          <a href="#sec-curriculum-overview" class="tree-node tree-chapter-node active" data-level="1" data-index="0">
            <span class="tree-name font-mono">Curriculum Overview: 6 Stages / 30 Modules</span>
            <span class="tree-badge font-mono">INIT</span>
          </a>""")
    
    current_index = 1
    for stage in CURRICULUM_DATA:
        s_num = stage["stage_num"]
        s_title = stage["title"].split(": ", 1)[1] if ": " in stage["title"] else stage["title"]
        # Stage Main Section Header Node
        nodes.append(f"""          <!-- Stage {s_num} Main Section -->
          <a href="#sec-stage-{s_num}" class="tree-node tree-chapter-node" data-level="1" data-index="{current_index}">
            <span class="tree-name font-mono">{s_num} {html.escape(s_title)}</span>
            <span class="tree-badge font-mono">STG 0{s_num}</span>
          </a>""")
        current_index += 1
        
        # Modules
        for mod in stage["modules"]:
            m_num = mod["num"]
            m_badge = f"{m_num:03d}"
            m_title = mod["title"]
            nodes.append(f"""          <a href="#sec-module-{m_num}" class="tree-node tree-subtopic-node" data-level="2" data-index="{current_index}">
            <span class="tree-guide font-mono">&#9500;&#9472;&#9472;</span>
            <span class="tree-name font-mono">{m_num} {html.escape(m_title)}</span>
            <span class="tree-badge font-mono">{m_badge}</span>
          </a>""")
            current_index += 1
            
    # Comments Stream Node & Legal Node
    nodes.append(f"""          <!-- Comments & Legal Main Sections -->
          <a href="#forum-section" class="tree-node tree-chapter-node" data-level="1" data-index="{current_index}">
            <span class="tree-name font-mono">Institutional Comments Stream</span>
            <span class="tree-badge font-mono">FORUM</span>
          </a>""")
    current_index += 1
    nodes.append(f"""          <a href="#sec-footer" class="tree-node tree-chapter-node" data-level="1" data-index="{current_index}">
            <span class="tree-name font-mono">Statutory Disclaimer</span>
            <span class="tree-badge font-mono">LEGAL</span>
          </a>""")
    
    total_nodes = current_index + 1
    return "\n".join(nodes), total_nodes

def build_content_html():
    out = []
    
    # 0. Curriculum Overview Section
    out.append("""      <!-- ================= CURRICULUM OVERVIEW DOSSIER ================= -->
      <section id="sec-curriculum-overview" class="page-directory-section" data-node-idx="0">
        <div class="section-tag-row font-mono main-chapter-header">
          <span class="tag-bracket">[</span><span class="tag-text">INDEXINDIA MASTER DEEP-TECH CURRICULUM • 6 STAGES • 30 MODULES</span><span class="tag-bracket">]</span>
        </div>
        <h2 class="institutional-title" style="font-size: 2.3rem; margin-top: 10px;">The Zero-Overhead Deep-Tech Playbook (Day 0 to Year 3+)</h2>
        <p class="story-narrative-lead">
          A definitive, sequentially numbered operational blueprint for founders, scientists, and systems engineers building hard-tech, physical-science, and sovereign technological capabilities in India. Designed to maximize runway, preserve founder equity, ensure absolute statutory compliance, and transition from lab concept (TRL 1) to institutional readiness (TRL 6+).
        </p>

        <div class="entity-cards-grid" style="margin-top: 20px;">
          <div class="entity-item">
            <h4 class="entity-name">
              <span class="font-mono" style="color: var(--accent-primary); font-size: 0.85rem;">[CHRONOLOGICAL TIMELINE]</span>
              6 Progressive Operational Stages
            </h4>
            <ul class="entity-details">
              <li><strong>Stage 1 (Months 0–3 | TRL 1–2):</strong> Day 0 — The Zero-Overhead Launchpad (Clean departure, Udyam MSME, Section 44ADA, TEA mass balances).</li>
              <li><strong>Stage 2 (Months 3–9 | TRL 2–3):</strong> The First Prototype — Free Labs &amp; Micro-Grants (I-STEM, PARAM supercomputing, NIDHI-PRAYAS, MOOWR).</li>
              <li><strong>Stage 3 (Months 9–15 | TRL 3–4):</strong> The Trigger Wire — Incorporation, Team &amp; IP Lock (Pvt Ltd, 4-year vesting, Form 18A patents, PIIA OpSec).</li>
              <li><strong>Stage 4 (Months 15–24 | TRL 4–5):</strong> Commercial Survival — Cracking Enterprise Pilots (30% sub-component, NRE, GeM startup tenders, MSME Samadhaan).</li>
              <li><strong>Stage 5 (Years 2–3 | TRL 5–6):</strong> Scaling the Machine — Heavy Grants, Homologation &amp; Manufacturing (ANRF RDI Fund, industrial zoning, BIS/WPC, HALT/HASS).</li>
              <li><strong>Stage 6 (Year 3 | TRL 6+):</strong> Institutional Readiness — Forensic Books, Crisis Survival &amp; Series A Bridge (Section 115BBF patent box, Ind AS 38, CCPS/iSAFE, Graduation Audit).</li>
            </ul>
          </div>
          <div class="entity-item">
            <h4 class="entity-name">
              <span class="font-mono" style="color: var(--accent-primary); font-size: 0.85rem;">[STATUTORY JURISDICTIONS]</span>
              Indian Sovereign Governance Architecture
            </h4>
            <ul class="entity-details">
              <li><strong>Corporate &amp; Contract Law:</strong> Companies Act 2013 (Section 2(68), Section 248 C-PACE), Indian Contract Act 1872 (Section 27 non-compete voidance).</li>
              <li><strong>Taxation &amp; Financial Shields:</strong> Income Tax Act (Section 44ADA, Section 80-IAC holiday, Section 35 R&amp;D write-offs, Section 115BBF 10% Patent Box, Section 43B(h)).</li>
              <li><strong>Intellectual Property:</strong> Patents Act 1970 (Form 18A expedited exam, SIPP, PCT delay), NBA biological clearances, Copyright Act (Section 52(1)(a) Fair Dealing).</li>
              <li><strong>Public Procurement:</strong> MSMED Act 2006 (Samadhaan 3x RBI interest), GeM Startup exemptions, Public Procurement Order (Make in India >50% Class-I).</li>
            </ul>
          </div>
        </div>
      </section>
""")
    
    # 1. Loop through stages and modules
    global_module_idx = 1
    for stage in CURRICULUM_DATA:
        s_num = stage["stage_num"]
        s_title = stage["title"]
        s_timeline = stage["timeline"]
        s_obj = stage["objective"]
        s_stat = stage["statutory"]
        
        out.append(f"""
      <!-- ================= STAGE {s_num} MAIN CHAPTER ================= -->
      <div class="chapter-anchor" id="sec-stage-{s_num}"></div>
      <div class="section-tag-row font-mono main-chapter-header">
        <span class="tag-bracket">[</span><span class="tag-text">{s_title.upper()} • {s_timeline.upper()}</span><span class="tag-bracket">]</span>
      </div>
      <h2 class="institutional-title" style="font-size: 2.05rem; margin-top: 10px;">{s_title} ({s_timeline})</h2>
      <p class="dossier-lead" style="margin-bottom: 14px;">
        {html.escape(s_obj)}
      </p>
      <div class="statutory-citation-badge font-mono" style="display: inline-block; padding: 5px 12px; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; font-size: 0.76rem; color: var(--text-primary); margin-bottom: 24px;">
        <strong>Statutory &amp; Regulatory Benchmarks:</strong> {html.escape(s_stat)}
      </div>
""")
        
        for mod in stage["modules"]:
            m_num = mod["num"]
            m_title = mod["title"]
            m_lead = mod["lead"]
            tabs = mod["tabs"]
            
            tab1 = tabs[0]
            tab2 = tabs[1]
            
            p1_html = "".join([f"<li><strong>{html.escape(title)}:</strong> {html.escape(desc)}</li>" for title, desc in tab1["points"]])
            p2_html = "".join([f"<li><strong>{html.escape(title)}:</strong> {html.escape(desc)}</li>" for title, desc in tab2["points"]])
            
            out.append(f"""      <!-- Module {m_num:02d}: {html.escape(m_title)} -->
      <section id="sec-module-{m_num}" class="page-directory-section" data-node-idx="{global_module_idx}">
        <h3 class="story-section-title">{m_num}. {html.escape(m_title)}</h3>
        <p class="story-narrative-lead">{html.escape(m_lead)}</p>

        <div class="entity-cards-grid">
          <div class="entity-item">
            <h4 class="entity-name">
              <span class="font-mono" style="color: var(--accent-primary); font-size: 0.85rem;">[{tab1['tag']}]</span>
              {html.escape(tab1['title'])}
            </h4>
            <ul class="entity-details">
              {p1_html}
            </ul>
          </div>

          <div class="entity-item">
            <h4 class="entity-name">
              <span class="font-mono" style="color: var(--accent-primary); font-size: 0.85rem;">[{tab2['tag']}]</span>
              {html.escape(tab2['title'])}
            </h4>
            <ul class="entity-details">
              {p2_html}
            </ul>
          </div>
        </div>
      </section>
""")
            global_module_idx += 1
            
    return "\n".join(out)

# Main generator execution
if __name__ == "__main__":
    with open("/home/dhaumya/IndexIndia/guide.html", "r", encoding="utf-8") as f:
        guide_html = f.read()

    tree_html, total_nodes = build_tree_nodes()
    content_html = build_content_html()

    # 1. Replace tree nodes in #tree-content-scroll
    tree_pattern = r'<div class="tree-content-scroll" id="tree-content-scroll">.*?</div>\s*<div class="tree-scrub-strip"'
    new_tree_block = f'<div class="tree-content-scroll" id="tree-content-scroll">\n{tree_html}\n        </div>\n        <div class="tree-scrub-strip"'
    guide_html = re.sub(tree_pattern, new_tree_block, guide_html, flags=re.DOTALL)

    # 2. Update rail tree status
    guide_html = re.sub(r'id="rail-tree-status">SECTION \d+/\d+<', f'id="rail-tree-status">SECTION 001/{total_nodes:03d}<', guide_html)

    # 3. Replace main content from <div class="content-area" ...> up to <!-- ================= DIRECTORY TREE FORUM ================= -->
    content_pattern = r'(<div class="content-area"[^>]*>).*?(<!-- ================= DIRECTORY TREE FORUM ================= -->)'
    new_content_block = f'\\1\n{content_html}\n      \\2'
    guide_html = re.sub(content_pattern, new_content_block, guide_html, flags=re.DOTALL)

    with open("/home/dhaumya/IndexIndia/guide.html", "w", encoding="utf-8") as f:
        f.write(guide_html)

    print(f"SUCCESS: Updated guide.html with 6 Stages, 30 Modules, and {total_nodes} tree nodes!")
