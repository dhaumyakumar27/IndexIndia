import html

TRACKS = [
    {
        'num': 1,
        'title': 'Pre-Genesis, Moonlighting & Clean Departure',
        'timeline': 'Months -3 to 0',
        'statute': 'Indian Contract Act, 1872 (Section 27) & IP Ownership Laws',
        'overview': 'Forensic audit of employment restrictions, moonlighting parameters, clean-room IP separation, emergency founder runway calculation, and co-founder technical skill matrixing prior to code generation or corporate incorporation.',
        'modules': [
            (1, 'Employment Contract Forensics & Moonlighting Clauses', 'Audit current employment agreements for restrictive non-competes under Section 27, moonlighting limitations, proprietary invention assignment provisions, and dual-employment covenants to guarantee unencumbered IP separation before writing any production code.', 'Employment Audit Protocol', 'Zero-IP Contamination Checklist'),
            (2, 'Prior Invention Carve-Outs & Clean-Room IP Creation', 'Use cryptographically timestamped logs, personal offline hardware, and strict time-stamping to conclusively prove early architecture was conducted outside employer hours without utilizing corporate compute, networks, or lab facilities.', 'Clean-Room Architecture Log', 'Invention Carve-Out Exhibit A'),
            (3, 'Section 27 (Indian Contract Act) & Non-Compete Realities', 'Understand that while post-termination non-compete covenants are declared void ab initio under Section 27 of the Indian Contract Act (Percept D\'Mark precedent), non-solicitation of clients, vendors, and core team members remains strictly enforceable by Indian courts.', 'Statutory Section 27 Analysis', 'Non-Solicitation Perimeter Defense'),
            (4, 'Founder Personal Runway & Zero-Salary Survival Math', 'Structure personal liquidity reserves, household emergency funds, health contingency buffers, and personal debt obligations to guarantee a minimum 12-month survival runway without drawing cash salary from the venture.', '12-Month Burn Rate Formula', 'Personal Solvency Stress-Test'),
            (5, 'Co-Founder Discovery & Technical Skill Matrixing', 'Pair deep-domain technical scientists with systems architects and operations engineers; execute a binding 3-month trial project with milestones before formalizing equity splits and corporate roles.', 'Domain-Systems Matrix', '3-Month Pre-Equity Trial Agreement')
        ]
    },
    {
        'num': 2,
        'title': 'R&D Philosophy, Ideation & Problem Validation',
        'timeline': 'Months 0–3',
        'statute': 'WIPO Patent Classification, DSIR Guidelines & TRL Benchmarks',
        'overview': 'Establishment of deep-tech engineering discipline, Technology Readiness Level (TRL 1–9) milestone tracking, 70/30 frontier-commercial dual-track R&D rules, enterprise bottleneck discovery, prior art scraping, and rigorous techno-economic analysis.',
        'modules': [
            (6, 'The Universal Innovation Spectrum', 'Treat polymers, advanced synthetic biomaterials, smart responsive textiles, precision chemicals, and medical hardware as pure scientific R&D, breaking free from the Indian startup ecosystem\'s software and aggregator bias.', 'Deep-Tech Horizon Map', 'Material Science R&D Framework'),
            (7, 'TRL (Technology Readiness Level) Mapping', 'Benchmark lab discoveries and prototype evolution from TRL 1 (basic principles observed) through TRL 4 (lab validation) to TRL 9 (proven commercial deployment) to align with statutory research grant disbursement tranches.', 'TRL 1–9 Progression Matrix', 'Milestone Verification Protocol'),
            (8, 'The 70/30 Dual-Track R&D Rule', 'Allocate 70% of core engineering bandwidth toward the primary frontier breakthrough and 30% toward an immediate, commercializable sub-component or analytic tool to generate early survival revenue.', 'Bandwidth Allocation Schedule', 'Short-Term Commercialization Roadmap'),
            (9, 'Reverse Incubation & Enterprise Problem Discovery', 'Map critical manufacturing and supply-chain bottlenecks inside large corporations (Goliaths) before initiating laboratory benchwork to secure verifiable B2B pilot demand.', 'Enterprise Bottleneck Scorecard', 'Reverse Incubation Interview Guide'),
            (10, 'Prior Art & Global Patent Landscape Scraping', 'Leverage WIPO PATENTSCOPE, Google Patents, and Espacenet to systematically verify technical novelty, identify expired foundational patents, and confirm Freedom-to-Operate (FTO) before sinking capital into dead-end research.', 'FTO Search Workflow', 'Patent Landscape Audit Template'),
            (11, 'First-Principles Techno-Economic Analysis (TEA)', 'Calculate theoretical thermodynamic energy balances, mass transfer budgets, stoichiometric yields, and target Bill of Materials (BOM) to verify the proposed technology is economically viable at commercial industrial scale.', 'TEA Mass-Energy Calculator', 'Target BOM Scaling Model'),
            (12, 'Scientific Kill-Criteria & Pivot Physics', 'Establish brutal, pre-committed laboratory kill-metrics (e.g., thermal stability thresholds, minimum catalytic turnover, mechanical tensile failure) to terminate failing experiments early rather than falling victim to sunk-cost bias.', 'Objective Kill-Criteria Matrix', 'Experimental Pivot Decision Tree')
        ]
    },
    {
        'num': 3,
        'title': 'Legal Genesis & Entity Architecture',
        'timeline': 'Months 0–6',
        'statute': 'Companies Act, 2013, MSME Development Act, 2006 & Income Tax Act (Sec 44ADA/80-IAC)',
        'overview': 'Two-stage entity structuring moving from a featherweight Sole Proprietorship/Udyam with presumptive tax shields to an institutional Private Limited Company with CCPS issuance, DPIIT recognition, affirmative AoA vetoes, and Director KYC hygiene.',
        'modules': [
            (13, 'Phase A Featherweight Genesis', 'Operate initially as a Sole Proprietorship backed by an instant Udyam (MSME) registration to keep Day-1 statutory audit, secretarial, and compliance overhead at absolute zero while executing feasibility experiments.', 'Udyam Registration Walkthrough', 'Zero-Compliance Operating Guide'),
            (14, 'Presumptive Taxation Shield (Section 44ADA)', 'Utilize Section 44ADA of the Income Tax Act to declare 50% of gross receipts as presumptive taxable profits on up to ₹75 Lakhs in research consulting stipends, eliminating complex corporate bookkeeping.', 'Section 44ADA Tax Modeling', 'Stipend Invoicing & Documentation'),
            (15, 'The Entity Trigger Wires', 'Identify the non-negotiable legal tripwires (signing high-liability customer contracts, hiring formal payroll employees, receiving institutional equity, or securing statutory capital grants) requiring immediate corporate upgrade.', 'Tripwire Assessment Checklist', 'Transition Action Plan'),
            (16, 'Phase B Institutional Upgrade (Pvt. Ltd.)', 'Incorporate a Private Limited Company under Section 2(68) of the Companies Act via SPICe+ (INC-32) to unlock CCPS issuance, structured ESOP pools, institutional venture rounds, and limited corporate liability.', 'SPICe+ Incorporation Blueprint', 'Share Capital Structure Plan'),
            (17, 'DPIIT Startup India Recognition', 'Secure formal DPIIT recognition immediately post-incorporation to unlock 3-year labor and environmental law self-certification, patent fee rebates (80%), and eligibility for the Section 80-IAC corporate tax holiday.', 'DPIIT Application Exhibits', 'Section 80-IAC Tax Exemption Dossier'),
            (18, 'The Co-Founder Pre-Nup & Vesting', 'Execute an ironclad Founders\' Agreement featuring mandatory 4-year reverse vesting schedules, 1-year cliff periods, continuous IP assignment covenants, and bad-leaver share clawback provisions.', 'Vesting & Clawback Agreement', 'Founder Departure Terms Sheet'),
            (19, 'Articles of Association (AoA) & Founder Veto Rights', 'Entrench affirmative voting rights and protective covenants into the corporate AoA to prevent minority investors or debt providers from altering the long-term scientific and manufacturing roadmap.', 'AoA Affirmative Matters Clause', 'Charter Amendment Resolution'),
            (20, 'Director Identification (DIN), DSC & DIR-3 KYC Hygiene', 'Maintain active Class-3 Digital Signature Certificates (DSC) and file annual DIR-3 KYC compliance before the statutory September deadline to prevent automatic DIN deactivation and punitive ₹5,000 compounding fees.', 'DIN & DSC Lifecycle Tracker', 'DIR-3 KYC Annual Compliance Sheet')
        ]
    },
    {
        'num': 4,
        'title': 'Academic Spin-Outs & Institutional Infrastructure',
        'timeline': 'Months 3–12',
        'statute': 'Ministry of Education Spin-out Directives & CSIR Technology Transfer Norms',
        'overview': 'Accessing publicly funded premier academic laboratories, national testing equipment via I-STEM, negotiating technology licensing with university TTOs, managing faculty equity compliance, and executing protective CRADA agreements.',
        'modules': [
            (21, 'Piggybacking National Labs & Academic Equipment', 'Access state-of-the-art analytical equipment across IIT, NIT, IISc, CIPET, and CSIR laboratories on hourly pay-per-use rates rather than exhausting venture capital on heavy lab CapEx.', 'National Lab Access Directory', 'Equipment Utilization Contract'),
            (22, 'National Testing Portals (I-STEM)', 'Utilize the Office of the Principal Scientific Adviser\'s I-STEM portal to locate, reserve, and schedule subsidized transmission electron microscopes (TEM), mass spectrometers, and cleanrooms nationwide.', 'I-STEM Slot Reservation Guide', 'Equipment Rate-Card Analysis'),
            (23, 'Navigating Technology Transfer Offices (TTOs)', 'Negotiate technology transfer agreements aggressively with academic TTOs, structuring royalty-bearing licenses capped at 2–4% net sales rather than permitting universities to take crippling Day-1 equity stakes.', 'TTO Licensing Term Sheet', 'Royalty Cap & Buyout Clause'),
            (24, 'Faculty Co-Founders & Sabbatical Rules', 'Structure compliant advisory equity and scientific consulting retainers for university professors, navigating CCS (Conduct) Rules and university sabbatical norms to prevent institutional conflict-of-interest actions.', 'Faculty Advisory Framework', 'Statutory NOC Documentation'),
            (25, 'Selecting a Technology Business Incubator (TBI)', 'Evaluate DST/BIRAC-supported TBIs strictly on wet-lab infrastructure, specialized characterization equipment, hazardous waste handling, and sovereign grant disbursement quotas rather than generic desks.', 'TBI Infrastructure Audit Matrix', 'Incubator Agreement Review'),
            (26, 'CRADA & Joint R&D Agreements', 'Execute Cooperative Research and Development Agreements (CRADA) with national labs that unambiguously define pre-existing background IP and ring-fence commercial foreground IP created during collaboration.', 'CRADA Agreement Template', 'Foreground IP Ring-Fencing Exhibit')
        ]
    },
    {
        'num': 5,
        'title': 'The Lean Digital Lab, Compute & AI Tool Genesis',
        'timeline': 'Year 1',
        'statute': 'National Supercomputing Mission (NSM), IT Act, 2000 & BSA Compliance',
        'overview': 'Eliminating recurring enterprise SaaS expenses via local offline LLMs, prompt-driven material science extraction, Cloudflare/Supabase serverless micro-tools, national PARAM supercomputer access, and legitimate CAD startup licenses.',
        'modules': [
            (27, 'The Zero-SaaS R&D Tech Stack', 'Replace predatory recurring enterprise SaaS suites with local markdown files, Git version-controlled repositories, and lightweight open-source command-line utilities to maintain zero fixed software overhead.', 'Zero-SaaS Tool Inventory', 'Git-Based Document Hierarchy'),
            (28, 'Local AI Lab Setup', 'Deploy quantized open-source models (Qwen 2.5, Llama 3) locally via Ollama to privately parse proprietary chemical formulas, clinical trial logs, and patent filings without leaking trade secrets to third-party cloud APIs.', 'Ollama Local Ingestion Script', 'Offline Air-Gapped Setup Guide'),
            (29, 'Domain-Specific System Prompt Scaffolds', 'Build deterministic, non-conversational system prompt harnesses utilizing strict XML/JSON delimiters to extract high-accuracy technical parameters from unstructured material science and bio-literature.', 'Structured Prompt Harness', 'Technical Schema Validator'),
            (30, 'BYOK (Bring Your Own Key) & Serverless Automation', 'Chain Claude, Gemini, and OpenAI APIs through edge Cloudflare Workers and PostgreSQL Supabase backends to create responsive internal lab automation tools costing fractions of a cent per execution.', 'Cloudflare Edge Worker Code', 'Supabase Database Schema'),
            (31, 'Cloud Compute Credits & National Supercomputing (NSM / IndiaAI)', 'Secure high-tier startup cloud credits ($100k+ on AWS/Google/Azure) and apply for domestic PARAM supercomputing access through the National Supercomputing Mission for molecular dynamics and finite element simulations.', 'PARAM Access Application Exhibit', 'Compute Credit Maximization Plan'),
            (32, 'Legitimate CAD/CAE Software Startup Licensing', 'Secure legitimate, steep-discount startup and incubator licenses for SolidWorks, ANSYS, COMSOL, and Altium to preempt catastrophic Business Software Alliance (BSA) copyright infringement lawsuits during Series A legal due diligence.', 'Startup Licensing Directory', 'Software Audit Trail Register'),
            (33, 'Electronic Lab Notebooks (ELN) & Data Provenance', 'Maintain immutable, cryptographically hashed, and timestamped digital lab notebooks (ELNs) to establish unshakeable patent priority dates and defend against international trade secret theft challenges.', 'ELN Cryptographic Hashing Guide', 'Lab Data Integrity SOP'),
            (34, 'Terminal-Fast Web Presence', 'Deploy brutalist, lightning-fast static technical documentation portals and whitepapers using 11ty or Hugo, hosted for zero cost on GitHub Pages or Cloudflare Pages with sub-second global time-to-first-byte.', 'Static Technical Portal Repo', 'Speed Optimization Checklist'),
            (35, 'Low-Friction Payment & Feedback Plumbing', 'Integrate domestic Indian merchant payment links (Getvik, Cashfree) and Web3Forms to capture paid B2B pilot commitments, technical feedback, and sample purchase deposits directly from static landing pages.', 'B2B Pilot Checkout Flow', 'Webhook Integration Script')
        ]
    },
    {
        'num': 6,
        'title': 'Physical Lab Setup, Industrial Zoning & Safety',
        'timeline': 'Years 1–2',
        'statute': 'The Factories Act, 1948, Petroleum Act, 1934 & State Industrial Development Acts',
        'overview': 'Industrial zoning selection in notified industrial zones (GIDC, MIDC, KIADB), managing Factories Act employee thresholds, heavy three-phase power sanctioning, SPCB Consent to Establish/Operate, and AERB radiation compliance.',
        'modules': [
            (36, 'Industrial Zoning vs. Commercial Leasing (GIDC/MIDC/KIADB)', 'Lease physical wet-lab and prototype fabrication facilities exclusively in designated state industrial development corporation zones (GIDC, MIDC, KIADB) to avoid arbitrary municipal sealing actions.', 'Zoning Classification Audit', 'Industrial Lease Due Diligence'),
            (37, 'Shops & Establishments vs. The Factories Act, 1948', 'Rigorously track active shop-floor headcount to navigate the statutory transition from state Shops & Establishments registration to full Factories Act compliance once crossing 10 workers (with power) or 20 workers (without power).', 'Headcount Compliance Matrix', 'Factories Act Registration SOP'),
            (38, 'Three-Phase Power Sanctioning & Utility Subsidies', 'Calculate peak motor starting currents and continuous thermal loads to sanction dedicated three-phase industrial power feeders, while claiming state-level industrial power tariff subsidies.', 'Power Load Calculation Table', 'Utility Subsidy Application Form'),
            (39, 'Hazardous Materials, PESO & Environmental Clearances', 'Secure State Pollution Control Board (SPCB) Consent to Establish (CTE) and Consent to Operate (CTO), alongside PESO clearances for high-pressure gas manifolds, flammables, and hazardous solvent inventories.', 'SPCB Red/Orange/Green Matrix', 'PESO Gas Storage Filing Guide'),
            (40, 'Radiation, Laser & Chemical Safety (AERB & MSDS)', 'Comply with Atomic Energy Regulatory Board (AERB) e-LORA licensing for X-ray diffraction and analytical nucleonic equipment, maintaining indexed GHS Material Safety Data Sheets (MSDS) for all chemical reagents.', 'e-LORA AERB Registration SOP', 'Hazardous Chemical Safety Ledger'),
            (41, 'Calibration & NABL Lab Standards (ISO/IEC 17025)', 'Maintain certified calibration trails traceable to the National Physical Laboratory (NPL) across all measurement sensors, balances, and oscilloscopes to ensure lab test data withstands scrutiny by enterprise enterprise auditors.', 'ISO 17025 Equipment Log', 'NABL Traceability Register')
        ]
    },
    {
        'num': 7,
        'title': 'Customs, Supply Chain & Rapid Prototyping',
        'timeline': 'Years 1–2',
        'statute': 'Foreign Trade (Development and Regulation) Act, 1992 & Customs Act, 1962',
        'overview': 'Import-Export Code (IEC) acquisition, hyper-accurate HSN classification for specialized sensors, MOOWR duty-deferment schemes, ATA Carnet international sample transport, and domestic MSME micro-machining networks.',
        'modules': [
            (42, 'Import-Export Code (IEC) & Customs HSN Classification', 'Secure instant DGFT Import-Export Code registration and systematically classify specialized components under precise 8-digit HSN codes to prevent indefinite customs holds at air cargo ports.', 'DGFT IEC Setup Walkthrough', 'HSN Classification Decision Flow'),
            (43, 'R&D Customs Duty Exemptions & MOOWR Scheme', 'Leverage DSIR recognition and the CBIC MOOWR (Manufacture and Other Operations in Warehouse) scheme to defer or entirely waive crippling basic customs duties and IGST on imported capital equipment and active reagents.', 'MOOWR In-Bond Manufacturing Guide', 'DSIR Customs Exemption Exhibit'),
            (44, 'ATA Carnet & Temporary Sample Exports', 'Execute Federation of Indian Chambers of Commerce and Industry (FICCI) ATA Carnets to transport multi-crore prototype hardware across international borders for customer pilots and expos without incurring foreign customs duties.', 'ATA Carnet Application Packet', 'International Transit Log'),
            (45, 'Re-Import of Defective Hardware for Repair', 'Utilize statutory Customs Notification No. 158/95 and related circulars to bring field-failed exported devices back into India for Root Cause Analysis and Return Merchandise Authorization (RMA) repair without double-taxation.', 'RMA Customs Clearance Protocol', 'Re-Import Declaration Exhibit'),
            (46, 'Rapid Prototyping & Domestic Micro-Batch Tooling', 'Build direct operational ties with regional MSME precision machining clusters (Peenya, Coimbatore, Bhosari, Rajkot) to secure low Minimum Order Quantities (MOQs) for CNC milling, wire-EDM, and PCB fabrication.', 'Regional MSME Machining Directory', 'Micro-Batch RFQ Template'),
            (47, 'Design for Manufacturing (DFM), Assembly (DFA) & Testing (DFT)', 'Incorporate standardized fasteners, draft angles, surface tolerances, and automated bed-of-nails PCB test jigs during early benchtop CAD phases to ensure zero friction when transitioning to mass volume assembly.', 'DFM/DFA Design Checklist', 'DFT Automated Jig Blueprint')
        ]
    },
    {
        'num': 8,
        'title': 'Intellectual Property (IP), Espionage Defense & Moats',
        'timeline': 'Years 1–2',
        'statute': 'The Patents Act, 1970, Biological Diversity Act, 2002 & Semiconductor Layout-Design Act',
        'overview': 'Filing provisional patents for 12-month priority, structuring complete specifications with multi-tier claims, Form 18A expedited examination, hardware anti-tamper potting, NBA biological compliance, and PCT international filings.',
        'modules': [
            (48, 'The Provisional Patent Playbook', 'File cost-effective MSME provisional patent specifications with the Indian Patent Office (IPO) to secure an immutable 12-month international priority date prior to public demonstration, investor pitching, or paper publication.', 'Provisional Patent Drafting Guide', 'Priority Date Preservation Strategy'),
            (49, 'Complete Specification & Claim Drafting', 'Structure broad independent claims capturing the fundamental physical/chemical apparatus, reinforced by dense dependent claims covering specific operating envelopes, ensuring competitors cannot engineer simple design-arounds.', 'Complete Specification Schema', 'Multi-Tier Claim Tree Architecture'),
            (50, 'Expedited Patent Examination (Form 18A)', 'Leverage DPIIT-recognized startup status under Rule 24C of the Patent Rules to file Form 18A, compressing the standard 48-month patent examination and First Examination Report (FER) timeline down to 8–12 months.', 'Form 18A Fast-Track Filing Guide', 'FER Response Strategy Document'),
            (51, 'Trade Secrets vs. Patents', 'Execute an objective forensic evaluation to determine whether novel chemical formulas, catalyst doping recipes, and ML weights should be protected indefinitely as trade secrets or disclosed publicly in patent filings.', 'Trade Secret vs. Patent Scorecard', 'Trade Secret Vaulting SOP'),
            (52, 'Hardware Anti-Tamper & Reverse-Engineering Countermeasures', 'Protect physical hardware against teardown analysis using opaque epoxy potting, silk-screen component scrubbing, encrypted microcontroller bootloaders, and hardware-enforced JTAG/SWD debug port disablement.', 'Physical Anti-Tamper Blueprint', 'Microcontroller Security Register'),
            (53, 'Cyber-Physical Air-Gapping & Lab OpSec', 'Isolate critical lab test instrumentation and 3D CAD modeling repositories from public corporate Wi-Fi networks using VLAN segmentation, physical air-gaps, and encrypted USB tokens to neutralize corporate espionage.', 'Lab Network Air-Gap Topology', 'Internal Data Exfiltration Policy'),
            (54, 'National Biodiversity Authority (NBA) Compliance', 'Secure mandatory Section 6 Form III approval from the National Biodiversity Authority before filing intellectual property applications for innovations utilizing Indian biological resources, microorganisms, or associated knowledge.', 'NBA Form III Approval Guide', 'Biological Sourcing Declaration'),
            (55, 'Plant Varieties, Agricultural IP (PPV&FRA) & GI Tags', 'Register and protect novel plant varieties, hybrid cultivars, bio-fertilizers, and microbial agricultural strains under the Protection of Plant Varieties and Farmers\' Rights Act (PPV&FRA) and Geographical Indications framework.', 'PPV&FRA Registration Exhibit', 'Agri-Tech IP Ring-Fencing Plan'),
            (56, 'IP Assignment & Invention Agreements (PIIA)', 'Enforce comprehensive Proprietary Information and Inventions Agreements (PIIA) ensuring every line of source code, CAD geometry, and experimental formulation developed by founders, interns, and vendors vests exclusively in the company.', 'Comprehensive PIIA Agreement', 'Contractor IP Assignment Addendum'),
            (57, 'Open-Source Licensing Hygiene', 'Audit all third-party software libraries, neural network backbones, and embedded firmware to purge viral copyleft licenses (GPLv3, AGPL) that mandate public disclosure of proprietary industrial control algorithms.', 'Open-Source License Audit Matrix', 'Dependency Sanitization Protocol'),
            (58, 'Industrial Design, Semiconductor Layouts, Trademarks & Copyrights', 'Protect product industrial form factors via Design Registrations (Designs Act, 2000), integrated circuit topographies under the SICLD Act, and core brand assets via Madrid Protocol trademark filings.', 'Design Registration Filing Guide', 'SICLD Semiconductor Layout Exhibit'),
            (59, 'PCT (Patent Cooperation Treaty), WIPO & SIPP Scheme', 'File Patent Cooperation Treaty (PCT) international applications through the WIPO receiving office to freeze foreign filing deadlines for 30 months, utilizing the SIPP scheme to access subsidized statutory patent attorneys.', 'PCT International Phase Timeline', 'SIPP Patent Attorney Fee Schedule')
        ]
    },
    {
        'num': 9,
        'title': 'Bootstrapped Talent & Team Architecture',
        'timeline': 'Years 1–2',
        'statute': 'Companies Act (Section 54), Apprentices Act, 1961 & EPFO/ESIC Regulations',
        'overview': 'Synthetic equity carry pools for early operators, formal ESOP pool creation, sweat equity issuance under Section 54, NAPS/NATS subsidized apprenticeships, PMRF PhD talent pipelines, and cross-border NRI consultant contracts.',
        'modules': [
            (60, 'The 100-Point Synthetic Carry Pool', 'Draft contractually binding phantom equity and synthetic carry agreements to incentivize early mission-critical engineers with enterprise value upside without surrendering voting rights or diluting cap-table cleanlines.', 'Phantom Equity Contract Template', '100-Point Allocation Schedule'),
            (61, 'Formal ESOP Architecture', 'Establish an institutional Employee Stock Option Plan (ESOP) trust or direct scheme under Section 62(1)(b) of the Companies Act with 4-year vesting, graduated strike prices, and clear exercise taxation protocols.', 'ESOP Scheme Rules & Policy', 'Option Grant Letter Template'),
            (62, 'Sweat Equity Issuance (Section 54)', 'Structure sweat equity share issuance under Section 54 of the Companies Act for technical specialists providing critical patents or know-how, navigating independent registered valuer audits and extraordinary general meetings.', 'Section 54 Compliance Checklist', 'Registered Valuer Assessment SOP'),
            (63, 'Government-Subsidized Apprenticeships (NAPS & NATS)', 'Leverage National Apprenticeship Promotion Scheme (NAPS) and National Apprenticeship Training Scheme (NATS) portals to hire polytechnic diploma holders and junior technicians with government-reimbursed stipends.', 'NAPS/NATS Employer Onboarding', 'Apprenticeship Contract Model'),
            (64, 'Academic & PhD Talent Pipelines', 'Partner with premier academic research laboratories to sponsor industrial master\'s and doctoral theses, utilizing Prime Minister\'s Research Fellowship (PMRF) programs to embed elite research talent in lab projects.', 'PMRF Industrial Thesis MoU', 'Academic Research Fellowship Agreement'),
            (65, 'Hiring NRI Scientists & Foreign Technical Consultants', 'Navigate Ministry of Home Affairs Employment Visa regulations, Foreigners Regional Registration Office (FRRO) norms, and cross-border master services agreements to legally engage foreign subject-matter experts.', 'FRRO Compliance Checklist', 'Cross-Border Expert Consulting Agreement'),
            (66, 'Milestone-Based Technical Contractor Agreements', 'Engage specialized finite-element analysts, embedded firmware engineers, and regulatory writers on strict deliverable-gated technical milestone contracts rather than unverified hourly retainers.', 'Milestone-Gated SOW Template', 'Technical Deliverable Acceptance SOP'),
            (67, 'Early HR & Statutory Hygiene', 'Institute ironclad Non-Disclosure Agreements, non-solicitation clauses, statutory Prevention of Sexual Harassment (PoSH) Internal Complaints Committees, and systematically monitor mandatory EPFO/ESIC headcount thresholds.', 'Statutory HR Compliance Manual', 'PoSH ICC Establishment Resolution')
        ]
    },
    {
        'num': 10,
        'title': 'Sovereign Capital, State Policies & Non-Dilutive Grants',
        'timeline': 'Years 1–3',
        'statute': 'General Financial Rules (GFR 2017), PFMS Guidelines & DSIR Scheme Rules',
        'overview': 'Securing non-dilutive sovereign R&D funding across PRISM, NIDHI-PRAYAS, BIRAC BIG, iDEX defense contracts, ANRF ₹1 Lakh Crore RDI financing, TDB commercialization loans, DSIR lab recognition, and PFMS accounting compliance.',
        'modules': [
            (68, 'Individual Innovator Grants (TRL 1–2)', 'Access Department of Scientific and Industrial Research (DSIR) PRISM grants providing up to ₹20 Lakhs in non-dilutive funding for early-stage proof-of-concept testing before formal company incorporation.', 'DSIR PRISM Proposal Blueprint', 'Pre-Incorporation Grant Budget'),
            (69, 'Prototype Micro-Grants (TRL 2–3)', 'Secure NIDHI-PRAYAS (₹10 Lakhs), Startup India Seed Fund Scheme (SISFS), and MeitY TIDE 2.0 grant tranches to physically fabricate early hardware without forfeiting founder equity.', 'NIDHI-PRAYAS Scoring Rubric', 'Prototype Fabrication Budget Sheet'),
            (70, 'State-Level Startup Grants & Industrial Subsidies', 'Apply for regional deep-tech funding schemes (Karnataka Elevate, TANSEED, Gujarat Startup Policy, Maharashtra MSInS) to secure non-dilutive capital and state patent cost reimbursements.', 'State Grant Eligibility Matrix', 'Regional Incentive Claim Guide'),
            (71, 'Defense & Strategic Aerospace Grants', 'Navigate Ministry of Defence Innovations for Defence Excellence (iDEX DISC and Prime) and DRDO Technology Development Fund (TDF) to win multi-crore milestone contracts solving military operational challenges.', 'iDEX Defence Application Blueprint', 'DRDO TDF Milestone Schedule'),
            (72, 'Sector-Specific Ministry Grants', 'Secure specialized deep-tech funding allocations including BIRAC Biotechnology Ignition Grant (BIG - ₹50 Lakhs), Ministry of Textiles NTTM, MoRTH highway infrastructure grants, and MNRE clean energy schemes.', 'BIRAC BIG Proposal Dossier', 'Sectoral Grant Application Strategy'),
            (73, 'International Bilateral R&D Grants (GITA)', 'Apply for Global Innovation and Technology Alliance (GITA) bilateral grants (such as Indo-Israel Industrial R&D and Indo-US Science & Technology Endowment Fund) to co-fund frontier development with international partners.', 'Bilateral R&D Proposal Framework', 'International Partner Consortium MoU'),
            (74, 'Corporate CSR Incubation Funding', 'Tap Schedule VII Corporate Social Responsibility (CSR) funds channeled through Ministry of Corporate Affairs approved technology incubators for environmental, water, medical, and hardware research projects.', 'Schedule VII CSR Eligibility Guide', 'Corporate CSR Grant Proposal Packet'),
            (75, 'The ANRF ₹1 Lakh Crore RDI Fund Playbook', 'Structure TRL 4+ deep-tech research to qualify for major catalytic equity and concessional long-term commercialization loans under the Anusandhan National Research Foundation (ANRF) RDI fund.', 'ANRF Commercialization Blueprint', 'Concessional Financing Dossier'),
            (76, 'Technology Development Board (TDB) Commercialization Funding', 'Secure low-interest sovereign debt (at 5% simple interest) from DST\'s Technology Development Board for scaling indigenous technology developed with domestic academic and scientific institutions.', 'TDB Loan Application Exhibit', 'Domestic Tech Commercialization Plan'),
            (77, 'DSIR In-House R&D Unit Recognition', 'Register your internal corporate laboratory with the Department of Scientific and Industrial Research (DSIR) to unlock institutional credibility, duty-free imports, and public procurement preferences.', 'DSIR Recognition Application Manual', 'R&D Infrastructure Documentation'),
            (78, 'Grant Accounting, PFMS & Utilization Certificates (UCs)', 'Manage Public Financial Management System (PFMS) modules, segregated zero-balance project accounts, and statutory Form GFR-12A Utilization Certificates (UC) to eliminate audit objections and clawbacks.', 'GFR-12A Utilization Template', 'PFMS Segregated Ledger SOP')
        ]
    },
    {
        'num': 11,
        'title': 'B2B Enterprise Sales & Solving the "Guinea Pig Problem"',
        'timeline': 'Years 2–3',
        'statute': 'Public Procurement (Preference to Make in India) Order, 2017 & MSMED Act (Sec 15-18)',
        'overview': 'Packaging the 30% sub-component for immediate cash, executing paid pilots with Non-Recurring Engineering (NRE) fees, cracking PSU procurement via GeM with startup exemptions, MSME Samadhaan 45-day payment enforcement, and IP licensing.',
        'modules': [
            (79, 'Packaging the 30% Sub-Component', 'Extract an intermediate sensor, proprietary algorithm, or novel chemical additive from your moonshot R&D roadmap and productize it into an immediate, high-margin B2B cash-generating product.', 'Sub-Component Extraction Guide', 'Immediate Commercialization Sheet'),
            (80, 'Paid Pilots & NRE (Non-Recurring Engineering) Contracts', 'Structure Master Services and Pilot Agreements that charge enterprise clients upfront for custom tooling and engineering integration, fiercely rejecting indefinite unpaid proof-of-concept traps.', 'Paid Pilot Terms Agreement', 'NRE Cost-Recovery Schedule'),
            (81, 'B2B Pricing Physics & Total Cost of Ownership (TCO)', 'Price industrial innovations based on quantified economic value creation (yield improvement, scrap reduction, downtime elimination) rather than cost-plus formulas to capture true enterprise upside.', 'TCO Quantification Model', 'Value-Based Pricing Calculator'),
            (82, 'Hardware-as-a-Service (HaaS) & Pay-Per-Use Models', 'Convert large equipment capital expenditure into recurring operating leases backed by telemetry, enabling enterprise clients to adopt unproven hardware without waiting for annual CapEx budget cycles.', 'HaaS Master Lease Agreement', 'Telemetry-Gated Billing Protocol'),
            (83, 'Cracking PSU & Government Procurement (GeM)', 'Navigate the Government e-Marketplace (GeM), invoke statutory Department of Expenditure relaxations for DPIIT startups regarding prior turnover and experience, and claim Earnest Money Deposit (EMD) exemptions.', 'GeM Startup Exemption Guide', 'Public Sector Bid Preparation SOP'),
            (84, 'Make in India (Public Procurement Order) Class-I/II Local Supplier Rules', 'Audit domestic manufacturing BOM to achieve >50% local value addition, securing Class-I Local Supplier status and statutory purchase preference in public sector mega-tenders.', 'Local Value Addition Audit Sheet', 'Make in India Self-Certification'),
            (85, 'Enterprise Procurement Survival', 'Negotiate standard enterprise vendor agreements to enforce strict liability caps (limited to 1x contract value), ring-fence background IP, limit liquidated damages, and secure milestone advances.', 'Enterprise MSA Negotiation Guide', 'Liability Limitation Clauses'),
            (86, 'Escrow Source-Code & CAD Deposit Agreements', 'Alleviate enterprise vendor continuity fears by depositing software source code and CAD production packages in tri-party escrow vaults, releasable strictly upon bankruptcy or business cessation.', 'Tri-Party Escrow Agreement', 'Software Release Condition Exhibit'),
            (87, 'MSME Samadhaan Enforcement', 'Enforce the statutory 45-day payment rule under Section 15 of the MSMED Act by filing formal recovery petitions on the MSME Samadhaan portal to legally compel delayed payments with compounding interest.', 'MSME Samadhaan Filing Guide', 'Statutory Demand Notice Template'),
            (88, 'IP Licensing, Joint Ventures & Royalty Models', 'License patented formulations and design registrations to established manufacturing conglomerates with mandatory minimum annual royalty floors and quarterly audit inspection rights.', 'Master IP License Agreement', 'Royalty Floor & Audit Rights Addendum')
        ]
    },
    {
        'num': 12,
        'title': 'Clinical, Field Trial & Regulatory Homologation',
        'timeline': 'Years 2–3',
        'statute': 'Medical Devices Rules, 2017, Drugs and Cosmetics Act, 1940 & Motor Vehicles Act, 1988',
        'overview': 'Pre-clinical animal testing via CPCSEA, CDSCO human clinical trials and CTRI registration, BIS CRS/ISI hardware marks, WPC equipment type approval, automotive ARAI certification, and dual-use SCOMET export licensing.',
        'modules': [
            (89, 'Pre-Clinical Animal Testing Ethics (CPCSEA)', 'Navigate the Committee for the Purpose of Control and Supervision of Experiments on Animals (CPCSEA) for toxicity and biocompatibility protocols covering biomaterials and novel medical formulations.', 'CPCSEA Protocol Application', 'Animal Ethics Approval Dossier'),
            (90, 'Human Clinical Trials & Registry (CDSCO & CTRI)', 'Secure Institutional Ethics Committee (IEC) clearances, register trial protocols on the Clinical Trials Registry - India (CTRI), and execute mandatory clinical subject indemnity insurance.', 'CTRI Registration Walkthrough', 'Subject Indemnity Insurance Policy'),
            (91, 'Medical Devices, Diagnostics & Novel Foods (CDSCO & FSSAI)', 'Classify hardware across CDSCO Class A to D risk tiers, implement ISO 13485 Quality Management Systems, and navigate FSSAI non-specified food approval workflows.', 'CDSCO Medical Device Classification', 'ISO 13485 QMS Implementation Plan'),
            (92, 'Biotech & Genetic Engineering Clearances (IBSC, RCGM & GEAC)', 'Establish an Institutional Biosafety Committee (IBSC), secure Review Committee on Genetic Manipulation (RCGM) import nods, and obtain Genetic Engineering Appraisal Committee (GEAC) clearances.', 'IBSC Constitution & Filing SOP', 'RCGM Biosafety Dossier Template'),
            (93, 'Electronics & Hardware Standards (BIS CRS & ISI)', 'Submit production hardware to Bureau of Indian Standards (BIS) recognized labs for safety and EMI/EMC compliance under the Compulsory Registration Scheme (CRS), and prepare for ISI factory inspections.', 'BIS CRS Registration Protocol', 'EMI/EMC Pre-Compliance Checklist'),
            (94, 'Wireless & Telecom Approvals (WPC & TEC)', 'Secure Wireless Planning & Coordination (WPC) Equipment Type Approval (ETA) for RF modules in de-licensed frequency bands, and obtain Telecommunication Engineering Centre (TEC) MTCTE certification.', 'WPC ETA Application Packet', 'TEC MTCTE Testing Protocol'),
            (95, 'Automotive, Drone, Maritime & Space Homologation', 'Obtain ARAI/iCAT CMVR homologation for EV powertrains, DGCA Drone Type Certification on Digital Sky, Indian Register of Shipping (IRS) marine classing, and IN-SPACe space payload authorizations.', 'ARAI Homologation Roadmap', 'DGCA Drone Certification Dossier'),
            (96, 'Infrastructure & Construction Material Homologation (CPWD, IRC & RDSO)', 'Get novel structural polymers and composites empanelled with the Central Public Works Department (CPWD), Indian Roads Congress (IRC), and Ministry of Railways RDSO vendor directories.', 'CPWD Vendor Empanelment Guide', 'RDSO Testing & Trial Specification'),
            (97, 'Energy, Packaging & Waste Compliance (BEE, LMPC & EPR)', 'Comply with Bureau of Energy Efficiency (BEE) Star Rating mandates, Legal Metrology (Packaged Commodities) labeling rules, and Central Pollution Control Board Extended Producer Responsibility (EPR) portals.', 'BEE Star Labeling Protocol', 'EPR Plastic/E-Waste Registration Guide'),
            (98, 'Software, AI & FinTech Compliance', 'Align architecture with the Digital Personal Data Protection (DPDP) Act, 2023, comply with CERT-In 6-hour cybersecurity reporting directives, achieve ISO 27001, and navigate RBI/SEBI regulatory sandboxes.', 'DPDP Act Architecture Checklist', 'CERT-In Incident Response SOP'),
            (99, 'Export Controls & Global Homologation', 'Obtain DGFT Special Chemicals, Organisms, Materials, Equipment and Technologies (SCOMET) export licenses for dual-use tech, and secure CE Marking (Europe), FCC/FDA (US), and RoHS/REACH compliance.', 'SCOMET License Application Guide', 'CE/FCC Global Testing Plan')
        ]
    },
    {
        'num': 13,
        'title': 'Sustainability, LCA & Carbon Monetization',
        'timeline': 'Years 2–3',
        'statute': 'Energy Conservation Act, 2001 (Carbon Credit Trading Scheme) & SEBI BRSR Core',
        'overview': 'Comprehensive ISO 14040/14044 Life Cycle Assessment, GreenPro/Ecomark eco-label acquisition, voluntary/compliance carbon credit trading on the Indian Carbon Market (CCTS), and corporate Scope 3 BRSR data packaging.',
        'modules': [
            (100, 'Life Cycle Assessment (ISO 14040 / 14044)', 'Quantify cradle-to-gate embodied carbon emissions, water footprints, and cumulative energy consumption using ISO 14040/14044 Life Cycle Assessment methodologies to validate green marketing claims.', 'ISO 14040 LCA Report Blueprint', 'Cradle-to-Gate Carbon Audit Model'),
            (101, 'GreenPro, Ecomark & OEKO-TEX Certifications', 'Secure CII GreenPro ecolabels, Bureau of Indian Standards Ecomark marks, and OEKO-TEX eco-certifications for novel polymers, sustainable construction products, and advanced textiles to command enterprise price premiums.', 'GreenPro Certification Manual', 'Eco-Label Audit Exhibit Packet'),
            (102, 'Monetizing Carbon Credits (CCTS, Verra & Gold Standard)', 'Register emissions-reduction technologies and industrial waste-valorization protocols with the Bureau of Energy Efficiency Indian Carbon Market (CCTS), Verra (VCS), and Gold Standard to mint tradable carbon offsets.', 'Carbon Credit Registration SOP', 'BEE CCTS Compliance Roadmap'),
            (103, 'Enterprise Scope 3 Emissions Reporting', 'Format verified environmental metrics to directly integrate into corporate enterprise clients\' mandatory SEBI Business Responsibility and Sustainability Reporting (BRSR Core) Scope 3 greenhouse gas disclosures.', 'BRSR Scope 3 Integration Sheet', 'Corporate Carbon Reduction Exhibit')
        ]
    },
    {
        'num': 14,
        'title': 'Manufacturing Scale-Up, Quality & Field Reliability',
        'timeline': 'Years 2–3',
        'statute': 'Bureau of Indian Standards Act, 2016 & ISO 9001 Quality Management Standards',
        'overview': 'Contract manufacturing versus in-house pilot lines, tooling ownership and golden sample preservation, ISO 9001 IQC/SPC quality gates, multi-source supply chain redundancy, HALT/HASS stress testing, and RMA workflows.',
        'modules': [
            (104, 'Contract Manufacturing (CM) vs. In-House Pilot Lines', 'Calculate the financial and operational breakeven threshold between outsourcing production to Electronics Manufacturing Services (EMS) partners versus funding an internal pilot assembly line.', 'Make-vs-Buy Breakeven Calculator', 'EMS Selection Due Diligence Checklist'),
            (105, 'Tooling Ownership, Molds & Golden Samples', 'Draft manufacturing vendor agreements establishing absolute startup legal ownership of custom injection molds, progressive stamping dies, and firmware jigs housed inside third-party vendor factories.', 'Tooling Ownership & Bailment Contract', 'Golden Sample Calibration Protocol'),
            (106, 'Vendor Qualification & Quality Control (QA/QC)', 'Implement rigid Incoming Quality Control (IQC) batch testing, Statistical Process Control (SPC) limits on key dimensions, and ISO 9001 quality management systems to prevent catastrophic batch defects.', 'IQC Sampling Inspection Table', 'SPC Control Chart Template'),
            (107, 'Supply Chain Redundancy & Single-Source Risk', 'Identify and qualify secondary domestic and overseas suppliers for mission-critical semiconductors, custom specialized alloys, optical sensors, and active chemical reagents to mitigate supply shocks.', 'Single-Source Risk Mitigation Plan', 'Alternate Supplier Audit SOP'),
            (108, 'Accelerated Life Testing (ALT) & HALT/HASS', 'Subject pre-production hardware prototypes to Highly Accelerated Life Testing (HALT) and Stress Screening (HASS) across thermal cycling, dust chambers, vibration tables, and grid voltage spikes.', 'HALT/HASS Test Chamber Profile', 'Environmental Reliability Report'),
            (109, 'Hardware Warranty, RMA & Field Failure Physics', 'Structure comprehensive Return Merchandise Authorization (RMA) tracking systems, establish regional buffer spare pools, and execute physical 8D Root Cause Analysis on returned field units.', 'RMA Workflow & Buffer Pool Guide', '8D Root Cause Analysis Template'),
            (110, 'Commercial, Product & D&O Liability Insurance', 'Secure commercial general liability, comprehensive product liability (including catastrophic failure and recall riders), and Directors & Officers (D&O) coverage before deploying hardware into production client facilities.', 'Product Liability Policy Review', 'D&O Policy Risk Coverage Table')
        ]
    },
    {
        'num': 15,
        'title': 'Forensic Financial Plumbing & R&D Tax Architecture',
        'timeline': 'Years 2–3',
        'statute': 'Income Tax Act, 1961 (Sections 35, 115BBF, 194J) & Ind AS 38 Intangible Assets',
        'overview': 'Corporate banking hygiene and audit voucher trails, treasury management for grant tranches, EEFC foreign currency accounts and e-BRC realization, founder remuneration, GST refunds on inverted duty structures, Ind AS 38 R&D capitalization, and CARO 2020 readiness.',
        'modules': [
            (111, 'Corporate Banking Hygiene & Voucher Trails', 'Enforce absolute structural separation between founder personal capital and corporate bank accounts, maintaining audit-ready debit voucher trails and dual-authorization corporate current account protocols.', 'Corporate Banking Control Policy', 'Debit Voucher Internal Control SOP'),
            (112, 'Treasury Management for Idle Grant & Seed Tranches', 'Deploy unspent venture capital and milestone grant disbursements into overnight liquid debt funds, corporate treasury deposits, and auto-sweep facilities without breaching sovereign grant utilization guidelines.', 'Treasury Investment Policy Guide', 'Grant Utilization Protection Sheet'),
            (113, 'Foreign Currency Accounts (EEFC) & Export Realization (e-BRC)', 'Maintain Exchange Earner\'s Foreign Currency (EEFC) bank accounts to hold USD/EUR receivables without instant FX conversion fees, tracking Electronic Bank Realization Certificates (e-BRC) through DGFT portals.', 'EEFC Account Management SOP', 'e-BRC Realization & Compliance Guide'),
            (114, 'Founder Remuneration Architecture (Salary vs. Professional Fees)', 'Optimize executive compensation structures across formal director salary (Section 192 with TDS), specialized technical advisory retainers (Section 194J), and bona fide operational expense reimbursements.', 'Founder Compensation Model', 'Director Salary vs. Advisory Fees Tax Comparison'),
            (115, 'GST Architecture for R&D', 'Claim full Input Tax Credit (ITC) on heavy capital testing gear, file claims for accumulated ITC refunds under Inverted Duty Structures, and execute statutory Letters of Undertaking (LUT) for zero-rated exports.', 'GST Inverted Duty Refund Guide', 'Export LUT Filing Walkthrough'),
            (116, 'R&D Capitalization vs. Expensing (Ind AS 38)', 'Distinguish with mathematical precision between exploratory research expenses (expensed directly on the P&L) and technical development expenditures (capitalized on the Balance Sheet as Intangible Assets under Ind AS 38).', 'Ind AS 38 Capitalization Matrix', 'R&D Asset Ledger Schedule'),
            (117, 'Scientific Research Tax Deductions (Section 35)', 'Claim statutory 100% tax deductions on operational revenue expenditure and capital equipment investments dedicated to in-house scientific research under Section 35(1)(iv) of the Income Tax Act.', 'Section 35 Claim Documentation', 'In-House Scientific Asset Report'),
            (118, 'The Indian Patent Box Regime (Section 115BBF)', 'Take advantage of the concessional 10% corporate income tax rate on royalty income derived from patents developed, registered, and commercialized in India under Section 115BBF of the Income Tax Act.', 'Section 115BBF Calculation Model', 'Patent Royalty Revenue Allocation'),
            (119, 'TDS, Equalization Levy & Cross-Border Software Payments', 'Deduct statutory Tax Deducted at Source (TDS) on vendor contracts, manage Equalization Levy obligations, and obtain Chartered Accountant Form 15CA/15CB remittances for foreign cloud services and testing fees.', 'Form 15CA/15CB Remittance SOP', 'Withholding Tax & TDS Schedule'),
            (120, 'Forensic Audit Readiness (CARO 2020)', 'Prepare accounting ledgers for institutional venture due diligence by documenting Related Party Transactions (RPTs), physical inventory verification audits, and statutory tax clearing under CARO 2020 reporting norms.', 'CARO 2020 Audit Preparedness Guide', 'Related Party Transaction Disclosure Form'),
            (121, 'Working Capital, BOM Costing & Cash Runway Modeling', 'Build dynamic three-statement financial models integrating inventory holding cycles, accounts receivable aging, grant tranche milestones, and realistic supplier payment terms to project true net cash runway.', 'Dynamic Working Capital Model', 'Cash Runway Stress-Testing Sheet')
        ]
    },
    {
        'num': 16,
        'title': 'Go-To-Market, Technical Authority & Distribution',
        'timeline': 'Years 2–3',
        'statute': 'Foreign Trade Policy 2023 (RoDTEP, EPCG) & Competition Act, 2002',
        'overview': 'Peer-reviewed whitepapers and application notes that bypass marketing departments, industrial channel distributor margin agreements, field application engineering onboarding, standards committee infiltration, and export incentives.',
        'modules': [
            (122, 'Whitepapers, Benchmarks & Technical Authority', 'Author and publish peer-reviewed technical whitepapers, detailed application notes, and reproducible benchmarking data that bypass corporate marketing gatekeepers and convince skeptical chief engineers.', 'Engineering Application Note Schema', 'Benchmarking Technical Whitepaper Template'),
            (123, 'Channel Partners, System Integrators & Distributors', 'Structure multi-tier distributor agreements specifying dealer margins, territorial exclusivity milestones, inventory carrying obligations, and factory certification training for specialized industrial distributors.', 'Industrial Distribution Agreement', 'Channel Partner Margin & Exclusivity Terms'),
            (124, 'Field Application Engineering (FAE) & Customer Onboarding', 'Deploy dedicated Field Application Engineers to physically integrate your sensors, materials, or components into the customer\'s operational assembly line, guaranteeing rapid pilot conversion.', 'FAE Deployment Playbook', 'Customer Line Integration SOP'),
            (125, 'Trade Shows, Standards Committees & Industry Consortia', 'Participate actively in Bureau of Indian Standards (BIS) technical sectional committees, CII/FICCI industrial task forces, and premier international technical expos to establish unshakeable market presence.', 'Standards Committee Strategy', 'Industrial Expo Lead Capture SOP'),
            (126, 'International Market Entry & Export Incentives', 'Leverage Foreign Trade Policy export schemes including the Remission of Duties and Taxes on Exported Products (RoDTEP), EPCG zero-duty capital imports, and export promotion council delegations.', 'RoDTEP Duty Rebate Schedule', 'EPCG Capital Goods Export Protocol')
        ]
    },
    {
        'num': 17,
        'title': 'Institutional Capital & The Series A Bridge',
        'timeline': 'Year 3',
        'statute': 'Foreign Exchange Management Act (FEMA 20(R)), SEBI (AIF) Regulations & Companies Act',
        'overview': 'SIDBI venture debt, CGTMSE collateral-free MSME credit, TReDS invoice discounting, equipment leasing, deep-tech valuation physics, CCPS/iSAFE structuring, dual FEMA/Income Tax DCF valuations, and term sheet forensics.',
        'modules': [
            (127, 'Non-Dilutive Debt & Working Capital Facilities', 'Access SIDBI Venture Debt, Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE) collateral-free bank loans (up to ₹5 Crore), and TReDS invoice discounting without signing personal guarantees.', 'CGTMSE Bank Application Packet', 'TReDS Platform Factoring Guide'),
            (128, 'Equipment Leasing & Asset-Backed Financing', 'Finance capital-heavy CNC milling centers, cleanroom modular enclosures, and testing gear through asset-backed lease arrangements rather than burning expensive venture equity.', 'Asset-Backed Equipment Lease Model', 'Equipment Lessor Evaluation Sheet'),
            (129, 'Valuation Physics for Pre-Revenue & Deep-Tech Startups', 'Establish institutional company valuations based on defensible patent portfolios, TRL milestone achievements, government grant endorsements, and signed NRE contracts where standard SaaS multiples fail.', 'Deep-Tech Valuation Framework', 'IP & Milestone Asset Scorecard'),
            (130, 'Convertible Instruments (CCPS & iSAFE)', 'Structure Compulsorily Convertible Preference Shares (CCPS) and India-compliant iSAFE convertible notes, negotiating protective valuation caps, discount triggers, and conversion mechanisms.', 'CCPS Master Terms Exhibit', 'iSAFE Note Investment Agreement'),
            (131, 'Share Valuation Dual-Compliance (FEMA vs. Income Tax)', 'Reconcile Merchant Banker Discounted Cash Flow (DCF) valuations to simultaneously satisfy statutory RBI FEMA pricing floors (for foreign FDI) and Income Tax Section 56(2)(viib) Angel Tax ceiling limits.', 'Dual-Compliant DCF Valuation Model', 'Merchant Banker Certificate Guide'),
            (132, 'Term Sheet Forensics', 'Dissect and negotiate term sheet clauses: liquidation preferences (enforcing 1x non-participating), broad-based weighted average anti-dilution, founder drag-along protections, and Right of First Refusal (ROFR).', 'Term Sheet Clause Comparison Table', 'Founder Protective Covenants Exhibit'),
            (133, 'Cross-Border FEMA Compliance (FDI & ODI)', 'Execute mandatory Single Master Form (FC-GPR) filings on the RBI FIRMS portal for foreign equity investment, ensure compliance with Press Note 3 bordering-nation restrictions, and manage Overseas Direct Investment (ODI).', 'RBI FIRMS FC-GPR Filing Manual', 'Press Note 3 Screening Checklist'),
            (134, 'HoldCo-SubCo, AIF Interfaces & Section 80M Tax Mechanics', 'Structure multi-tier corporate holding architectures (HoldCo/SubCo) compliant with RBI 50-50 NBFC principal business restrictions, utilizing Section 80M inter-corporate dividend deductions.', 'HoldCo-SubCo Corporate Architecture', 'Section 80M Inter-Corporate Tax Model'),
            (135, 'The Institutional Data Room', 'Organize an enterprise virtual data room (VDR) housing fully audited capitalization tables, patent prosecution histories, NABL certified test reports, customer contracts, and secretarial registers.', 'Institutional VDR Architecture Plan', 'Due Diligence Readiness Checklist')
        ]
    },
    {
        'num': 18,
        'title': 'Crisis Management, Litigation & Black-Swan Survival',
        'timeline': 'Years 1–3',
        'statute': 'Customs Act (Sec 124), Patents Act (Sec 25/64) & Arbitration and Conciliation Act, 1996',
        'overview': 'Handling customs port seizures and show-cause notices, responding to patent infringement cease-and-desist threats, managing industrial accidents and field product recalls, co-founder deadlocks, and supply-chain force majeure.',
        'modules': [
            (136, 'Surviving Customs Seizures & Show-Cause Notices', 'Resolve air cargo port seizures on imported experimental reagents and hardware by contesting misclassification show-cause notices under Section 124 of the Customs Act and posting provisional duty bonds.', 'Customs SCN Defense Strategy', 'Section 124 Provisional Release Bond'),
            (137, 'Handling Patent Infringement Notices & Cease-and-Desist Letters', 'Respond decisively to competitor legal threats and patent assertion entities (PAEs) through rapid prior-art invalidity searches, clean design-around implementation, and aggressive patent pre-grant oppositions.', 'Cease-and-Desist Response Protocol', 'Patent Invalidity Search Strategy'),
            (138, 'Product Recall, Industrial Accidents & Crisis PR', 'Manage catastrophic field hardware failures, factory fire or chemical incidents, statutory labor commissioner reporting, structured customer containment protocols, and transparent communications.', 'Crisis Management & Recall SOP', 'Statutory Incident Notification Guide'),
            (139, 'Co-Founder Deadlock & Dispute Resolution', 'Execute pre-agreed Russian roulette / shotgun buyout mechanisms, mediation protocols, and formal arbitration under the Arbitration and Conciliation Act to resolve irreconcilable founder disputes.', 'Co-Founder Deadlock Resolution Rules', 'Shotgun Buyout Valuation Formula'),
            (140, 'Force Majeure & Supply-Chain Embargo Playbooks', 'Restructure customer delivery timelines, declare statutory Force Majeure notices, and activate secondary global supply sources during international trade embargoes, semiconductor shortages, or geopolitical crises.', 'Force Majeure Legal Notice Template', 'Supply-Chain Crisis Action Plan')
        ]
    },
    {
        'num': 19,
        'title': 'Governance, M&A & Clean Exit Mechanics',
        'timeline': 'Year 3+',
        'statute': 'Companies Act, 2013 (Sec 230-240, 248) & Competition Act, 2002',
        'overview': 'Secretarial standards (SS-1/SS-2) board governance, monthly investor reporting, industrial conglomerate M&A asset and IP transfers, secondary share liquidity for founders, C-PACE fast-track corporate strike-offs, and residual IP salvage.',
        'modules': [
            (141, 'Board Meeting Hygiene & Statutory Registers', 'Maintain flawless Secretarial Standards (SS-1 for Board Meetings, SS-2 for General Meetings), draft precise statutory board minutes, and file mandatory MGT-7 and AOC-4 annual returns to avert director disqualification.', 'Secretarial Standards Governance Manual', 'Annual MCA Filing Checklist'),
            (142, 'Managing Investor Updates & Advisory Boards', 'Run disciplined, transparent monthly investor updates detailing net cash burn, engineering TRL milestones, key customer pipeline metrics, and specific operational asks that turn passive angel investors into active door-openers.', 'Monthly Investor Update Schema', 'Advisory Board Management Policy'),
            (143, 'Strategic M&A, Joint Ventures & Acqui-Hire Mechanics', 'Prepare corporate capitalization tables, employee retention agreements, and foreground IP assignments for structured asset acquisitions, mergers under Section 232, or acqui-hires by domestic or multinational conglomerates.', 'Deep-Tech M&A Preparedness Guide', 'Asset Sale vs. Equity Merger Analysis'),
            (144, 'Secondary Sales & Early Founder Liquidity', 'Structure partial secondary share sales for founders during growth-stage Series A or Series B equity rounds, securing personal financial security without signaling lack of commitment to incoming institutional investors.', 'Secondary Share Sale Framework', 'Founder Liquidity Side Letter'),
            (145, 'Clean Winding-Up & Fast Track Exit (Section 248 / C-PACE)', 'Execute rapid, voluntary corporate closure through the Centre for Processing Accelerated Corporate Exit (C-PACE) under Section 248 of the Companies Act, ensuring clean closure with zero director disqualification under Section 164(2).', 'C-PACE Strike-Off Walkthrough', 'Corporate Closure Indemnity Board Resolution'),
            (146, 'Post-Mortem IP Salvage', 'Legally spin out, auction, or license residual patent claims, proprietary algorithms, CAD packages, and specialized lab machinery to recovery funds or academic partners prior to formal corporate dissolution.', 'Residual IP Valuation & Transfer Agreement', 'Lab Asset Liquidation Protocol')
        ]
    },
    {
        'num': 20,
        'title': 'Founder Psychology, Ethics & Terminal Resilience',
        'timeline': 'Year 3+',
        'statute': 'Institutional Research Ethics & National Dual-Use Security Norms',
        'overview': 'Combating founder isolation and long-horizon deep-tech burnout, institutional scientific data integrity and audit defense, managing stealth mode against ethical boundaries in defense/bio innovations, and the 3-year graduation audit for institutional acquirers.',
        'modules': [
            (147, 'Managing Founder Burnout & Isolation in Long R&D Cycles', 'Recognize and counteract the severe psychological fatigue and social isolation inherent in multi-year hardware and physical research cycles that lack the instant gratification feedback loops of consumer software.', 'Founder Mental Resilience Protocol', 'Long-Cycle R&D Stress Management Sheet'),
            (148, 'Scientific Integrity & Data Fabrication Guardrails', 'Enforce immutable laboratory verification protocols and independent blind testing to guarantee all published experimental data is completely reproducible, eliminating fraudulent claims that trigger venture collapse.', 'Lab Scientific Integrity Policy', 'Independent Reproduction Audit SOP'),
            (149, 'The Ethics of Dual-Use Technology & Stealth Mode', 'Balance strict operational stealth mode with ethical boundaries, navigating the moral dilemmas and statutory export controls surrounding autonomous defense systems, cyber tools, and synthetic biological capabilities.', 'Dual-Use Ethical Governance Charter', 'Stealth Mode Public Disclosure Policy'),
            (150, 'The 3-Year Graduation Audit & Preparing for Firm X', 'Conduct a rigorous comprehensive institutional audit verifying the enterprise has crossed the deep-tech Valley of Death (reaching TRL 6+), backed by defended IP, clean balance sheets, and recurring B2B pilot revenue—prepared for sovereign scale.', 'Valley of Death Graduation Audit', 'Firm X Institutional Readiness Packet')
        ]
    }
]

print(f"Loaded {len(TRACKS)} Tracks successfully.")

