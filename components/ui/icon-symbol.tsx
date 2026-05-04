import { ChevronRight, Code, Home, LucideIcon, Send } from 'lucide-react-native';
import { OpaqueColorValue, type StyleProp, type ViewStyle } from 'react-native';

const MAPPING = {
  'house.fill': Home,
  'paperplane.fill': Send,
  'chevron.left.forwardslash.chevron.right': Code,
  'chevron.right': ChevronRight,
} satisfies Record<string, LucideIcon>;

type IconSymbolName = keyof typeof MAPPING;
type IconSymbolWeight =
  | 'ultralight'
  | 'thin'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: IconSymbolWeight;
}) {
  const Icon = MAPPING[name];
  return <Icon color={color} size={size} strokeWidth={2.2} style={style} />;
}
