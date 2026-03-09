import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, MessageSquare, Heart, TrendingUp, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommunityStats {
  totalPosts: number;
  totalMembers: number;
  todayPosts: number;
  totalLikes: number;
}

export default function CommunityStatsBar() {
  const [stats, setStats] = useState<CommunityStats>({
    totalPosts: 0,
    totalMembers: 0,
    todayPosts: 0,
    totalLikes: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [postsRes, membersRes, todayRes] = await Promise.all([
        supabase.from("community_posts").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_approved", true),
        supabase.from("community_posts").select("id", { count: "exact", head: true }).gte("created_at", today),
      ]);

      setStats({
        totalPosts: postsRes.count || 0,
        totalMembers: membersRes.count || 0,
        todayPosts: todayRes.count || 0,
        totalLikes: 0,
      });
    };

    fetchStats();
  }, []);

  const items = [
    { icon: Users, label: "Membros", value: stats.totalMembers, color: "text-primary" },
    { icon: MessageSquare, label: "Posts", value: stats.totalPosts, color: "text-blue-500" },
    { icon: Flame, label: "Hoje", value: stats.todayPosts, color: "text-orange-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-around rounded-xl bg-card border border-border p-3"
    >
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
          <span className="text-sm font-bold text-foreground">{item.value}</span>
          <span className="text-[10px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </motion.div>
  );
}
