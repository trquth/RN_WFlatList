import {StyleSheet, View} from 'react-native';
import {ExtendTheme, useTheme} from '@react-navigation/native';
import React, {useMemo} from 'react';
interface Props {
  height?: number | string;
  width?: number | string;
  color?: string;
  isTransparent?: boolean;
}
const SizeBox: React.FC<Props> = ({
  height = 12,
  width = 12,
  color = 'transparent',
  isTransparent = true,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View
      style={[
        styles.line,
        {
          height: height,
          width: width,
          backgroundColor: isTransparent ? 'transparent' : color,
        },
      ]}
    />
  );
};
export default React.memo(SizeBox);

const createStyles = (_theme: ExtendTheme) =>
  StyleSheet.create({
    line: {
      width: 8,
      height: 8,
    },
  });
