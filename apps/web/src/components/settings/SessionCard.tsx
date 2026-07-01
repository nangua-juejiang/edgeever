import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SessionCardProps {
  authRequired: boolean;
  isLoggingOut: boolean;
  onLogout: () => void;
}

export const SessionCard = ({ authRequired, isLoggingOut, onLogout }: SessionCardProps) => {
  if (!authRequired) {
    return null;
  }

  return (
    <Card className="w-full min-w-0 overflow-hidden border-rose-100 bg-rose-50/30 shadow-none">
      <CardContent className="pt-6">
        <Button
          size="md"
          variant="danger"
          className="bg-rose-600 font-semibold text-white shadow-sm hover:bg-rose-700"
          disabled={isLoggingOut}
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "安全退出中..." : "退出登录"}
        </Button>
      </CardContent>
    </Card>
  );
};
