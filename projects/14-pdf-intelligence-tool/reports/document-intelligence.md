# Document Intelligence Report

Generated at: 2026-08-15T22:17:34.887Z

Documents analyzed: 2
Table-like rows extracted: 6

## Document Summaries

### Compliance Memo PDF Text Extract

- File: compliance-memo.txt
- Reference: MEMO-88-A
- Summary: Document: Compliance Memo PDF Text Extract Reference: MEMO-88-A Date: 2026-08-05 Owner: Operations Risk Team Contact: compliance@artesanal.example The Operations Risk Team completed a quarterly vendor compliance review. Two suppliers require updated insurance certificates before renewal.
- Signals: audit, compliance, due, renewal, risk

Entities:

- Dates: 2026-08-05, 2026-09-15, 2026-08-25, 2026-09-01, 2027-01-01
- Money: none
- Percentages: 87 percent
- Emails: compliance@artesanal.example
- Organizations: Operations Risk Team, The Operations Risk Team, Northstar Components LLC, Riverbend Logistics Inc, Local Packaging Co

Table-like rows:

- Supplier: Northstar Components LLC; Status: Conditional; Required Action: Upload insurance certificate; Due Date: 2026-08-25
- Supplier: Riverbend Logistics Inc; Status: Conditional; Required Action: Confirm data handling policy; Due Date: 2026-09-01
- Supplier: Local Packaging Co; Status: Approved; Required Action: None; Due Date: 2027-01-01

### Vendor Invoice PDF Text Extract

- File: vendor-invoice.txt
- Reference: INV-2026-0142
- Summary: Document: Vendor Invoice PDF Text Extract Reference: INV-2026-0142 Date: 2026-07-31 Vendor: Northstar Components LLC Bill To: Artesanal Labs Contact: billing@northstar.example Northstar Components LLC requests payment for components delivered under purchase order PO-7781. Late payment may add a 2 percent service charge.
- Signals: due, late, payment

Entities:

- Dates: 2026-07-31, 2026-08-30
- Money: $48.00, $576.00, $420.00, $840.00, $35.00, $1451.00, $116.08, $1567.08
- Percentages: 2 percent
- Emails: billing@northstar.example
- Organizations: Northstar Components LLC, Artesanal Labs

Table-like rows:

- Item: Sensor Module; Qty: 12; Unit Price: $48.00; Total: $576.00
- Item: Edge Gateway; Qty: 2; Unit Price: $420.00; Total: $840.00
- Item: Shipping; Qty: 1; Unit Price: $35.00; Total: $35.00

## Real PDF Extraction Note

This demo starts from text files. A production pipeline would add PDF parsing or OCR before this analyzer and pass the extracted text into the same reporting step.

