import React, {useMemo} from 'react';
import {StyleSheet, View, ActivityIndicator} from 'react-native';
import {ExtendTheme, useTheme} from '@react-navigation/native';
import Modal from 'react-native-modal';

interface Props {
  isLoading: boolean;
}
const Loading: React.FC<Props> = ({isLoading}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Modal
      backdropOpacity={0.6}
      isVisible={isLoading}
      animationIn="fadeIn"
      animationOut="fadeOut"
    >
      <View style={styles.activityIndicatorWrapper}>
        <ActivityIndicator
          size="small"
          color={theme.colors.indicator}
          animating={isLoading}
        />
      </View>
    </Modal>
  );
};
const createStyles = (_theme: ExtendTheme) =>
  StyleSheet.create({
    activityIndicatorWrapper: {
      backgroundColor: _theme.colors.background,
      height: 80,
      width: 80,
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      alignSelf: 'center',
    },
  });

export default React.memo(Loading);
