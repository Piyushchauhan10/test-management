import React from 'react';

const AvatarCell: React.FC<{ name: string }> = React.memo(({ name }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colorIndex = name.charCodeAt(0) % 4;
  const bgClasses = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-destructive'];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full ${bgClasses[colorIndex]} flex items-center justify-center text-[10px] font-semibold text-primary-foreground shrink-0`}>
        {initials}
      </div>
      <span className="truncate font-medium">{name}</span>
    </div>
  );
});

AvatarCell.displayName = 'AvatarCell';
export default AvatarCell;
