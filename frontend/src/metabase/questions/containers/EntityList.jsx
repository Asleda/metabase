/* eslint "react/prop-types": "warn" */
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import { t } from "c-3po";
import EmptyState from "metabase/components/EmptyState";
import LoadingAndErrorWrapper from "metabase/components/LoadingAndErrorWrapper";
import ListFilterWidget from "metabase/components/ListFilterWidget";

import S from "../components/List.css";

import List from "../components/List";
import SearchHeader from "metabase/components/SearchHeader";
import ActionHeader from "../components/ActionHeader";

import _ from "underscore";

import {
  loadEntities,
  setSearchText,
  setItemSelected,
  setAllSelected,
  setArchived,
} from "../questions";
import { loadLabels } from "../labels";
import {
  getSection,
  getEntityIds,
  getSectionLoading,
  getSectionError,
  getSearchText,
  getVisibleCount,
  getSelectedCount,
  getAllAreSelected,
  getSectionIsArchive,
  getLabelsWithSelectedState,
} from "../selectors";

const mapStateToProps = (state, props) => {
  return {
    section: getSection(state, props),
    entityIds: getEntityIds(state, props),
    loading: getSectionLoading(state, props),
    error: getSectionError(state, props),

    searchText: getSearchText(state, props),

    visibleCount: getVisibleCount(state, props),
    selectedCount: getSelectedCount(state, props),
    allAreSelected: getAllAreSelected(state, props),
    sectionIsArchive: getSectionIsArchive(state, props),

    labels: getLabelsWithSelectedState(state, props),
  };
};

const mapDispatchToProps = {
  setItemSelected,
  setAllSelected,
  setSearchText,
  setArchived,
  loadEntities,
  loadLabels,
};

const SECTIONS = [
  {
    id: "all",
    name: t`所有`,
    icon: "all",
    empty: t`还没有人提问。`,
  },
  {
    id: "fav",
    name: t`收藏`,
    icon: "star",
    empty: t`你还没有收藏任何问题。`,
  },
  {
    id: "recent",
    name: t`最近`,
    icon: "recents",
    empty: t`你最近没有查看任何问题。`,
  },
  {
    id: "mine",
    name: t`保存`,
    icon: "mine",
    empty: t`你最近没有保存任何问题。`,
  },
  {
    id: "popular",
    name: t`流行`,
    icon: "popular",
    empty: t`显示所有最流行的问题。`,
  },
  {
    id: "archived",
    name: t`归档`,
    icon: "archive",
    empty: t`如果你不再需要一个提问，你可以将它归档。`,
  },
];

const DEFAULT_SECTION = {
  icon: "all",
  empty: t`There aren't any questions matching that criteria.`,
};

@connect(mapStateToProps, mapDispatchToProps)
export default class EntityList extends Component {
  static propTypes = {
    style: PropTypes.object,

    entityQuery: PropTypes.object.isRequired,
    entityType: PropTypes.string.isRequired,

    section: PropTypes.string,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.any,
    entityIds: PropTypes.array.isRequired,
    searchText: PropTypes.string.isRequired,
    setSearchText: PropTypes.func.isRequired,
    visibleCount: PropTypes.number.isRequired,
    selectedCount: PropTypes.number.isRequired,
    allAreSelected: PropTypes.bool.isRequired,
    sectionIsArchive: PropTypes.bool.isRequired,
    labels: PropTypes.array.isRequired,
    setItemSelected: PropTypes.func.isRequired,
    setAllSelected: PropTypes.func.isRequired,
    setArchived: PropTypes.func.isRequired,

    loadEntities: PropTypes.func.isRequired,
    loadLabels: PropTypes.func.isRequired,

    onEntityClick: PropTypes.func,
    onChangeSection: PropTypes.func,
    showSearchWidget: PropTypes.bool.isRequired,
    showCollectionName: PropTypes.bool.isRequired,
    editable: PropTypes.bool.isRequired,

    defaultEmptyState: PropTypes.string,
  };

  static defaultProps = {
    showSearchWidget: true,
    showCollectionName: true,
    editable: true,
  };

  componentDidUpdate(prevProps) {
    // Scroll to the top of the list if the section changed
    // A little hacky, something like https://github.com/taion/scroll-behavior might be better
    if (this.props.section !== prevProps.section) {
      ReactDOM.findDOMNode(this).scrollTop = 0;
    }
  }

  componentWillMount() {
    this.props.loadLabels();
    this.props.loadEntities(this.props.entityType, this.props.entityQuery);
  }
  componentWillReceiveProps(nextProps) {
    if (
      !_.isEqual(this.props.entityQuery, nextProps.entityQuery) ||
      nextProps.entityType !== this.props.entityType
    ) {
      this.props.loadEntities(nextProps.entityType, nextProps.entityQuery);
    }
  }

  getSection() {
    return (
      _.findWhere(SECTIONS, {
        id: (this.props.entityQuery && this.props.entityQuery.f) || "all",
      }) || DEFAULT_SECTION
    );
  }

  render() {
    const {
      style,
      loading,
      error,
      entityType,
      entityIds,
      searchText,
      setSearchText,
      showSearchWidget,
      visibleCount,
      selectedCount,
      allAreSelected,
      sectionIsArchive,
      labels,
      setItemSelected,
      setAllSelected,
      setArchived,
      onChangeSection,
      showCollectionName,
      editable,
      onEntityClick,
    } = this.props;

    const section = this.getSection();

    const hasEntitiesInPlainState =
      entityIds.length > 0 || section.section !== "all";

    const showActionHeader = editable && selectedCount > 0;
    const showSearchHeader = hasEntitiesInPlainState && showSearchWidget;
    const showEntityFilterWidget = onChangeSection;

    return (
      <div style={style}>
        {(showActionHeader || showSearchHeader || showEntityFilterWidget) && (
          <div className="flex align-center my1" style={{ height: 40 }}>
            {showActionHeader ? (
              <ActionHeader
                visibleCount={visibleCount}
                selectedCount={selectedCount}
                allAreSelected={allAreSelected}
                sectionIsArchive={sectionIsArchive}
                setAllSelected={setAllSelected}
                setArchived={setArchived}
                labels={labels}
              />
            ) : showSearchHeader ? (
              <div style={{ marginLeft: "10px" }}>
                <SearchHeader
                  searchText={searchText}
                  setSearchText={setSearchText}
                />
              </div>
            ) : null}
            {showEntityFilterWidget &&
              hasEntitiesInPlainState && (
                <ListFilterWidget
                  items={SECTIONS.filter(item => item.id !== "archived")}
                  activeItem={section}
                  onChange={item => onChangeSection(item.id)}
                />
              )}
          </div>
        )}
        <LoadingAndErrorWrapper
          className="full"
          loading={!error && loading}
          error={error}
        >
          {() =>
            entityIds.length > 0 ? (
              <List
                entityType={entityType}
                entityIds={entityIds}
                editable={editable}
                setItemSelected={setItemSelected}
                onEntityClick={onEntityClick}
                showCollectionName={showCollectionName}
              />
            ) : (
              <div className={S.empty}>
                <EmptyState
                  message={
                    section.id === "all" && this.props.defaultEmptyState
                      ? this.props.defaultEmptyState
                      : section.empty
                  }
                  icon={section.icon}
                />
              </div>
            )
          }
        </LoadingAndErrorWrapper>
      </div>
    );
  }
}
