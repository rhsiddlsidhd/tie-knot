import "server-only";
import type { UserRole } from "@/core/domain/user";
type JWTType = "REFRESH" | "ENTRY";

interface JWTBaseProps {
  type: JWTType;
}

interface RefreshEncrypt {
  type: "REFRESH";
  id: string;
  role: UserRole;
}

interface EntryEncrypt {
  type: "ENTRY";
  id?: string;
}

type EncryptProps = RefreshEncrypt | EntryEncrypt;

interface DecryptProps extends JWTBaseProps {
  token: string;
}

export { type EncryptProps, type DecryptProps };
