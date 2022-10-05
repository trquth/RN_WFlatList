import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
  Ref,
  ReactElement,
} from "react";
import {
  View,
  RefreshControl,
  StyleSheet,
  FlatList,
  FlatListProps,
  ActivityIndicator,
} from "react-native";
import _, { isArray, isEmpty } from "lodash";
import { useTheme } from "@react-navigation/native";
import { ItemPlaceHolderEvent } from "../holder";
import SearchHeader, {
  SearchHeaderRef,
} from "../search/search_box/SearchHeader";
import Loading from "../Loading";
import SizeBox from "../SizeBox";
import { Dimension } from "~/config";

//Refer link
//https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
//https://dirask.com/posts/React-forwardRef-with-generic-component-in-TypeScript-D6BoRD

let onEndReachedCalledDuringMomentum = true;

interface ICustomizeFlatListProps<T> extends FlatListProps<T> {
  startPage?: number;
  onLoadMore?: (
    currentIndex: number,
    searchText: string
  ) => Promise<T[] | null>;
  onPullToRefresh: (currentIndex: number) => Promise<T[] | null>;
  isEnableSearchBox?: boolean;
  flatListStyle?: T;
  CustomizeListEmptyComponent?:
    | React.ComponentType<T>
    | React.ReactElement
    | null
    | undefined;
  loadingType?: "placeholder" | "spin" | "none" | undefined;
  initData?: T[];
}

export interface ICustomizeFlatListRefObject<T> {
  requestPullToRefresh: () => void;
  requestUpdateItems: (newItems: T[]) => void;
  removeItem: (item: T) => void;
  addItemFirst: (item: T) => void;
}

const WFlatList = forwardRef(
  <T extends object>(
    {
      isEnableSearchBox = true,
      loadingType = "placeholder",
      initData,
      ...props
    }: ICustomizeFlatListProps<T>,
    ref: Ref<ICustomizeFlatListRefObject<T>>
  ) => {
    const [data, setData] = useState<{
      refreshing: boolean;
      loadingMore: boolean;
      items: T[];
      countUpdateItem: number;
      searchText: String;
    }>({
      refreshing: false,
      loadingMore: false,
      items: [],
      countUpdateItem: 0,
      searchText: "",
    });

    const theme = useTheme();

    const currentPage = useRef(props.startPage ? props.startPage : 0);
    const isConnected = useRef(true);
    const searchTextRef = useRef<string>("");
    const searchBoxRef = useRef<SearchHeaderRef>(null);

    useImperativeHandle(ref, () => ({
      requestPullToRefresh: () => {
        _handlerRefresh();
      },
      requestUpdateItems: (newItems: T[]) => {
        setData({ ...data, items: newItems });
      },
      removeItem: (item: T) => removeItem(item),
      addItemFirst: (item: T) => addItemFirst(item),
    }));

    const _isLoading = () => {
      return data.refreshing || data.loadingMore ? true : false;
    };

    const _handlerRefresh = useCallback(async () => {
      if (!_isLoading() && props.onPullToRefresh) {
        setData({
          ...data,
          refreshing: true,
          loadingMore: false,
        });
        searchBoxRef?.current?.clear();
        if (searchTextRef.current) {
          searchTextRef.current = "";
        }
        currentPage.current = props.startPage ? props.startPage : 0;
        if (isConnected.current) {
          let newItems: T[] | null = await props.onPullToRefresh(
            currentPage.current
          );
          _updateUIRefresh(newItems);
        } else {
          _updateUIRefresh(null);
        }
      }
    }, [data]);

    const _handlerLoadMore = useCallback(async () => {
      if (
        !_isLoading() &&
        props?.onLoadMore &&
        !onEndReachedCalledDuringMomentum
      ) {
        onEndReachedCalledDuringMomentum = true;
        setData({
          ...data,
          refreshing: false,
          loadingMore: true,
        });

        currentPage.current = currentPage.current + 1;
        console.log(
          "====== WFlatList Start Load More: currentPage = " +
            currentPage.current +
            ", list size = " +
            data.items.length +
            ", keyword = " +
            searchTextRef.current
        );
        if (isConnected.current) {
          let newItems: T[] | null =
            (await props?.onLoadMore?.(
              currentPage.current,
              searchTextRef.current
            )) || [];
          _updateUILoadMore(newItems);
        } else {
          _updateUILoadMore(null);
        }
      }
    }, [data]);

    const _updateUIRefresh = (newItems: T[] | null) => {
      //   console.log('_updateUIRefresh', newItems);
      if (!_.isNil(newItems) && _.isArray(newItems)) {
        setData({ ...data, items: newItems, loadingMore: false });
      } else {
        setData({ ...data, items: [], loadingMore: false });
      }
      //fix bug can't hide pull to refresh in ios
      // setTimeout(() => {
      //   setData({...data, refreshing: false});
      // }, 300);
      console.log(
        "======= WFlatList Refresh ===== currentPage = " +
          currentPage.current +
          data.items.length +
          "search text = " +
          data.searchText
      );
    };

    const _updateUILoadMore = (newItems: T[] | null) => {
      //console.log('_updateUILoadMore', newItems);
      if (!_.isNil(newItems) && _.isArray(newItems) && newItems.length > 0) {
        const len = newItems.length;
        for (let i = 0; i < len; i++) {
          data.items.push(newItems[i]);
        }
        setData({ ...data, refreshing: false, loadingMore: false });
      } else {
        currentPage.current = currentPage.current - 1;
        setData({ ...data, refreshing: false, loadingMore: false });
      }
      console.log(
        "======= WFlatList End Load More: currentPage = " +
          currentPage.current +
          ", list size = " +
          data.items.length
      );
    };
    const _keyExtractor = (item: T, index: number) => {
      return index.toString();
    };

    const _renderLoadMore = () => {
      if (data.loadingMore) {
        return (
          <View style={styles.viewLoadingBottom}>
            <Loading isLoading={true} />
          </View>
        );
      } else {
        return <View style={styles.viewLoadingBottom} />;
      }
    };

    const removeItem = (item: T) => {
      let items = data.items;
      const index = items.indexOf(item);
      if (index !== -1) {
        items.splice(index, 1);
        setData({ ...data, items: items });
      }
    };

    const addItemFirst = (item: T) => {
      if (item) {
        data.items.unshift(item);
        setData({ ...data, countUpdateItem: data.countUpdateItem + 1 });
      }
    };

    const _handleSearchData = useCallback(async () => {
      if (!_isLoading() && !onEndReachedCalledDuringMomentum) {
        onEndReachedCalledDuringMomentum = true;
        setData({
          ...data,
          refreshing: false,
          loadingMore: true,
        });

        currentPage.current = props.startPage ? props.startPage : 0;
        console.log(
          "====== CustomizeAlphabetList Start _handleSearchData: currentPage = " +
            currentPage.current +
            ", list size = " +
            data.items.length +
            ", keyword = " +
            searchTextRef.current
        );
        if (isConnected.current) {
          let newItems: T[] | null =
            (await props?.onLoadMore?.(
              currentPage.current,
              searchTextRef.current
            )) || [];
          if (
            !_.isNil(newItems) &&
            _.isArray(newItems) &&
            newItems.length > 0
          ) {
            setData((prevState) => {
              return {
                ...prevState,
                items: newItems!,
                refreshing: false,
                loadingMore: false,
              };
            });
          } else {
            _updateUILoadMore(null);
          }
        } else {
          _updateUILoadMore(null);
        }
      }
    }, [data]);

    //Search box handler
    const onChangeText = useCallback(
      async (text: string) => {
        console.log("run run onChangeText");
        searchTextRef.current = text;
        if (isEmpty(text)) {
          //Support no paging
          if (initData) {
            await props?.onLoadMore?.(0, "");
            return;
          }
          _handlerRefresh();
        } else {
          onEndReachedCalledDuringMomentum = false;
          _handleSearchData();
        }
      },
      [initData, _handlerRefresh, _handleSearchData]
    );

    const renderEmptyList = useCallback(() => {
      if (
        !data.refreshing &&
        !data.loadingMore &&
        isEmpty(data.items) &&
        props?.CustomizeListEmptyComponent
      ) {
        return props?.CustomizeListEmptyComponent;
      }
      return null;
    }, [data]);

    const renderList = () => {
      return (
        <FlatList
          {...props}
          data={isArray(initData) ? initData : data.items}
          refreshControl={
            <RefreshControl
              tintColor={theme.colors.primary}
              refreshing={data.refreshing}
              onRefresh={_handlerRefresh}
              colors={[theme.colors.primary]}
            />
          }
          keyExtractor={_keyExtractor}
          onEndReached={_handlerLoadMore}
          style={[styles.container, props?.flatListStyle]}
          ListFooterComponent={_renderLoadMore}
          removeClippedSubviews={true}
          onEndReachedThreshold={0.001}
          onMomentumScrollBegin={() => {
            onEndReachedCalledDuringMomentum = false;
          }}
          ListEmptyComponent={renderEmptyList()}
        />
      );
    };

    const renderPlaceHolder = () => {
      return [...Array(15).keys()].map((i) => <ItemPlaceHolderEvent key={i} />);
    };

    const renderSpinLoading = () => {
      return (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          animating={true}
        />
      );
    };

    const renderIndicator = () => {
      let children = null;
      switch (loadingType) {
        case "placeholder": {
          children = renderPlaceHolder();
          break;
        }
        case "spin": {
          children = renderSpinLoading();
          break;
        }
        default: {
          break;
        }
      }
      return <View style={styles.placeHolderContainer}>{children}</View>;
    };

    return (
      <>
        {isEnableSearchBox ? (
          <>
            <SearchHeader ref={searchBoxRef} onChangeText={onChangeText} />
            <SizeBox height={Dimension.SPACE_32} />
          </>
        ) : null}
        {data.refreshing && isEmpty(data.items)
          ? renderIndicator()
          : renderList()}
      </>
    );
  }
);
export default WFlatList as <T extends unknown>(
  props: ICustomizeFlatListProps<T> & {
    ref: Ref<ICustomizeFlatListRefObject<T>>;
  }
) => ReactElement;
//export default WFlatList;

const styles = StyleSheet.create({
  container: {},
  searchBox: { marginTop: 0 },
  viewLoadingBottom: {
    justifyContent: "center",
    height: 23,
    flex: 1,
  },
  labelNotFound: {
    fontSize: 17,
    textAlign: "center",
    color: "rgb(119, 144, 157)",
    marginTop: 15,
  },
  placeHolderContainer: { marginHorizontal: 16 },
});
