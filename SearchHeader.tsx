('use strict');
import React, {forwardRef, Ref, useImperativeHandle, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@react-navigation/native';

import SearchBar from 'react-native-search-bar';

interface SearchProps {
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onSearchButtonPress?: (text: string) => void;
  onCancelButtonPress?: () => void;
}

export interface SearchHeaderRef {
  clear: () => void;
}
const SearchHeader = forwardRef(
  (
    {placeholder = 'Search', onChangeText, onSearchButtonPress}: SearchProps,
    ref: Ref<SearchHeaderRef>,
  ) => {
    const theme = useTheme();
    const {t} = useTranslation();
    const searchBarRef = useRef(null);

    useImperativeHandle(ref, () => ({
      clear: () => searchBarRef.current?.clearText?.(),
    }));

    return (
      <SearchBar
        ref={searchBarRef}
        hideBackground
        placeholder={placeholder}
        onChangeText={onChangeText}
        onSearchButtonPress={onSearchButtonPress}
        onCancelButtonPress={() => {}}
      />
    );
  },
);

export default React.memo(SearchHeader);
