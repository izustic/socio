import LegalDocumentScreen from "@/src/components/legal/LegalDocumentScreen";
import { LEGAL_DOCUMENTS } from "@/src/constants/legal";

export default function DataComplianceRoute() {
  return <LegalDocumentScreen document={LEGAL_DOCUMENTS["data-compliance"]} />;
}
