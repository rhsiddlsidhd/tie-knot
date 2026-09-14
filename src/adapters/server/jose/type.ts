import "server-only";
import type { UserRole } from "@/core/domain/user";
type JwtType = "REFRESH" | "ENTRY";

interface JwtBaseProps {
  type: JwtType;
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

interface DecryptProps extends JwtBaseProps {
  token: string;
}

export { type EncryptProps, type DecryptProps };
