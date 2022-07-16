import React, { FC, useEffect, useRef, useState } from 'react';
import { ScrollSync } from 'react-virtualized';
import { CommonProp } from '../../interface/common_prop';
import { prefix } from '../../utils/deal_class_prefix';
import { parserTimeToPixel } from '../../utils/deal_data';
import { RowDnd } from '../row_rnd/row_rnd';
import { RowRndApi } from '../row_rnd/row_rnd_interface';
import './cursor.less';

/** 动画时间轴组件参数 */
export type CursorProps = CommonProp & {
  /** 距离左侧滚动距离 */
  scrollLeft: number;
  /** 设置光标位置 */
  setCursor: (param: { left?: number; time?: number }) => boolean;
  /** 时间轴区域dom ref */
  areaRef: React.MutableRefObject<HTMLDivElement>;
  /** 设置scroll left */
  deltaScrollLeft: (delta: number) => void;
  /** 滚动同步ref（TODO: 该数据用于临时解决scrollLeft拖住时不同步问题） */
  scrollSync: React.MutableRefObject<ScrollSync>;
};

export const Cursor: FC<CursorProps> = ({ disableDrag, cursorTime, setCursor, startLeft, scaleCount, scaleWidth, scale, scrollLeft, scrollSync, areaRef, deltaScrollLeft }) => {
  const rowRnd = useRef<RowRndApi>();
  const [draggingLeft, setDraggingLeft] = useState<undefined | number>();
  const [width, setWidth] = useState(Number.MAX_SAFE_INTEGER);

  useEffect(() => {
    if (areaRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        setWidth(areaRef.current.getBoundingClientRect().width);
      });
      resizeObserver.observe(areaRef.current!);
      return () => {
        resizeObserver && resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <RowDnd
      start={startLeft}
      ref={rowRnd}
      // dragging时，单向同步数据
      left={typeof draggingLeft === 'number' ? draggingLeft : parserTimeToPixel(cursorTime, { startLeft, scaleWidth, scale }) - scrollLeft}
      parentRef={areaRef}
      bounds={{
        left: 0,
        right: width,
      }}
      deltaScrollLeft={
        deltaScrollLeft
          ? (delta) => {
              // 当超过最大距离时，禁止滚动
              const data = scrollSync.current.state.scrollLeft + delta;
              if (data > scaleCount * (scaleWidth - 1) + startLeft - width) return;
              deltaScrollLeft(delta);
            }
          : undefined
      }
      enableDragging={!disableDrag}
      enableResizing={false}
      onDragStart={() => {
        setDraggingLeft(parserTimeToPixel(cursorTime, { startLeft, scaleWidth, scale }) - scrollLeft);
      }}
      onDragEnd={() => {
        setCursor({ left: draggingLeft + scrollLeft });
        setDraggingLeft(undefined);
      }}
      onDrag={({ left }, scroll = 0) => {
        const scrollLeft = scrollSync.current.state.scrollLeft;

        if (!scroll || scrollLeft === 0) {
          // 拖拽时，如果当前left < left min，将数值设置为 left min
          if (left < startLeft - scrollLeft) setDraggingLeft(startLeft - scrollLeft);
          else setDraggingLeft(left);
        } else {
          // 自动滚动时，如果当前left < left min，将数值设置为 left min
          if (draggingLeft < startLeft - scrollLeft - scroll) {
            setDraggingLeft(startLeft - scrollLeft - scroll);
          }
        }

        setCursor({ left: draggingLeft + scrollLeft });
        return false;
      }}
    >
      <div className={prefix('cursor')}>
        <svg className={prefix('cursor-top')} width="8" height="12" viewBox="0 0 8 12" fill="none">
          <path
            d="M0 1C0 0.447715 0.447715 0 1 0H7C7.55228 0 8 0.447715 8 1V9.38197C8 9.76074 7.786 10.107 7.44721 10.2764L4.44721 11.7764C4.16569 11.9172 3.83431 11.9172 3.55279 11.7764L0.552786 10.2764C0.214002 10.107 0 9.76074 0 9.38197V1Z"
            fill="#5297FF"
          />
        </svg>
        <div className={prefix('cursor-area')} />
      </div>
    </RowDnd>
  );
};
