import { useState, useRef, useEffect } from 'react';
import { AtSign, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface UserSuggestion {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

export const MentionInput = ({
  value,
  onChange,
  placeholder,
  className,
  maxLength = 500,
}: MentionInputProps) => {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Extract mentions from text
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]); // user_id
    }
    return mentions;
  };

  // Convert mentions to display format
  const getDisplayText = (text: string): string => {
    return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
  };

  // Search for users when typing @
  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setCursorPosition(cursor);

    // Check if we're in a mention context
    const textBeforeCursor = newValue.substring(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);

      if (query.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .eq('is_approved', true)
          .ilike('full_name', `%${query}%`)
          .limit(5);

        setSuggestions(data || []);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }

    onChange(newValue, extractMentions(newValue));
  };

  // Insert mention
  const insertMention = (user: UserSuggestion) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Replace @query with mention
    const mentionStart = textBeforeCursor.lastIndexOf('@');
    const beforeMention = textBeforeCursor.substring(0, mentionStart);
    const mentionText = `@[${user.full_name}](${user.user_id}) `;
    
    const newValue = beforeMention + mentionText + textAfterCursor;
    
    onChange(newValue, extractMentions(newValue));
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursor = beforeMention.length + mentionText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={getDisplayText(value)}
        onChange={handleInputChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          className
        )}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
          {suggestions.map((user) => (
            <button
              key={user.user_id}
              type="button"
              onClick={() => insertMention(user)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {user.full_name.charAt(0)}
              </div>
              <span className="text-sm">{user.full_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hint */}
      <div className="flex items-center justify-between mt-1 px-1">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <AtSign className="w-3 h-3" />
          Digite @ para mencionar
        </p>
        <p className="text-xs text-muted-foreground">
          {getDisplayText(value).length}/{maxLength}
        </p>
      </div>
    </div>
  );
};

// Helper to parse and render mentions in text
export const renderMentions = (text: string): React.ReactNode => {
  const parts = text.split(/(@\[[^\]]+\]\([^)]+\))/g);
  
  return parts.map((part, index) => {
    const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
    if (mentionMatch) {
      const [, name] = mentionMatch;
      return (
        <span key={index} className="text-primary font-medium">
          @{name}
        </span>
      );
    }
    return part;
  });
};
