'use strict';

/* global api, index, store */

const bookmarkList = (function() {
  const getIdFromElement = function(element) {
    return $(element)
      .closest('div')
      .data('id');
  };

  const handleAddBookmarkButton = function() {
    $('.js-add-bookmark-button').on('click', event => {
      let newItem = {
        id: 'undefined',
        title: '',
        url: '',
        desc: '',
        rating: 0
      };
      store.addItem(newItem, true);
      navButtonToggle();
      render();
    });
  };

  const handleBookmarkSubmit = function() {
    $('.bookmark-content').on('click', '.submit', event => {
      event.preventDefault();
      if (getIdFromElement(event.currentTarget) === 'undefined') {
        let newItem = {
          title: $('.bookmark-title input').val(),
          url: $('.bookmark-url input').val(),
          desc: $('.bookmark-description input').val(),
          rating: $('input[name=bookmark-rating]:checked').val()
        };
        api.addItem(newItem, response => {
          store.addItem(response);
          store.deleteBookmark('undefined');
          navButtonToggle();
          render();
        });
      } else {
        const updateItem = {};
        let item = store.findById(getIdFromElement(event.currentTarget));
        if ($('.bookmark-title input').val() !== item.title)
          updateItem.title = $('.bookmark-title input').val();
        if ($('.bookmark-url input').val() !== item.url)
          updateItem.url = $('.bookmark-url input').val();
        if ($('.bookmark-description input').val() !== item.desc)
          updateItem.desc = $('.bookmark-description input').val();
        if ($('input[name=bookmark-rating]:checked').val() !== item.rating)
          updateItem.rating = $('input[name=bookmark-rating]:checked').val();
        api.editItem(item.id, updateItem, response => {
          store.update(item.id, updateItem);
          item.editing = false;
          navButtonToggle();
          render();
        });
      }
    });
  };

  const handleBookmarkCancel = function() {
    $('.bookmark-content').on('click', '.cancel', event => {
      event.preventDefault();
      if (getIdFromElement(event.currentTarget) === 'undefined') {
        store.deleteBookmark('undefined');
        render();
        navButtonToggle();
      } else {
        let item = store.findById(getIdFromElement(event.currentTarget));
        item.editing = false;
        navButtonToggle();
        render();
      }
    });
  };

  const handleEdit = function() {
    $('.bookmark-content').on('click', '.edit', event => {
      let item = store.findById(getIdFromElement(event.currentTarget));
      item.editing = true;
      navButtonToggle();
      render();
    });
  };

  const navButtonToggle = function() {
    $('.add-bookmark').toggleClass('hidden');
    $('#rating-field').toggleClass('hidden');
  };

  const handleExpandView = function() {
    $('.bookmark-content').on('click', '.collapsible', event => {
      const item = store.findById(getIdFromElement(event.currentTarget));
      store.update(item.id, { expanded: !item.expanded });
      render();
    });
  };

  const handleDeleteBookmark = function() {
    $('.bookmark-content').on('click', '.delete', event => {
      const id = getIdFromElement(event.currentTarget);
      api.deleteItem(id, response => {
        store.deleteBookmark(id);
        render();
      });
    });
  };

  const handleFilter = function() {
    $('#rating-field').on('change', event => {
      store.ratingFilter = $('#rating-field option:selected').val();
      render();
    });
  };

  const handlePreviousPage = function() {
    $('.pagination').on('click', '.prev-page', event => {
      store.page -= 1;
      // console.log(store.page);
      render();
    });
  };

  const handleNextPage = function() {
    $('.pagination').on('click', '.next-page', event => {
      store.page += 1;
      // console.log(store.page);
      render();
    });
  };


  const bindEventListeners = function() {
    handleExpandView();
    handleAddBookmarkButton();
    handleBookmarkSubmit();
    handleDeleteBookmark();
    handleFilter();
    handleEdit();
    handleBookmarkCancel();
    handlePreviousPage();
    handleNextPage();
  };

  const render = function() {
    let filteredBookmarks = store.bookmarks;
    if (parseInt(store.ratingFilter) !== 0) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => {
        return bookmark.rating === parseInt(store.ratingFilter);
      });
    }
    const renderedBookmarks = renderBookmarks(filteredBookmarks);
    $('.bookmark-content').html(renderedBookmarks);
    $('.pagination').html(generatePagination());
  };

  const renderBookmarks = function(bookmarks) {
    let paginatedBookmarks = [];
    for (let i = 8 * store.page - 8; i < 8 * store.page; i++) {
      if (i < bookmarks.length) {
        paginatedBookmarks.push(
          bookmarks[i].expanded
            ? generateExpandedHTML(bookmarks[i])
            : generateBookmarkHTML(bookmarks[i])
        );
      }
    }
    return paginatedBookmarks;
    // return bookmarks.map(bookmark => {
    //   return bookmark.expanded
    //     ? generateExpandedHTML(bookmark)
    //     : generateBookmarkHTML(bookmark);
    // });
  };

  const generateRating = function(rating) {
    let generatedRating = `
      <span class="fa fa-star"></span>
      <span class="fa fa-star"></span>
      <span class="fa fa-star"></span>
      <span class="fa fa-star"></span>
      <span class="fa fa-star"></span>`;
    if (rating !== null) {
      generatedRating =
        '<span class="fa fa-star checked" />\n'.repeat(rating) +
        '<span class="fa fa-star" />\n'.repeat(5 - rating);
    }
    return generatedRating;
  };

  const generateEditRatingHTML = function(rating) {
    let generatedHTML = '';
    for (let i = 1; i <= 5; i++) {
      if (parseInt(rating) === i) {
        generatedHTML += `<input name="bookmark-rating" type="radio" value="${i}" checked="checked">${i}\n`;
      } else {
        generatedHTML += `<input name="bookmark-rating" type="radio" value="${i}">${i}\n`;
      }
    }
    return generatedHTML;
  };

  const generateBookmarkHTML = function(bookmark) {
    const rating = generateRating(bookmark.rating);
    return `
    <div class='bookmark' data-id="${bookmark.id}">
      <h2 class="collapsible">&#9654 ${bookmark.title}</h2>
      ${rating}
    </div>
    `;
  };

  const generateExpandedHTML = function(bookmark) {
    const rating = generateRating(bookmark.rating);
    let expanded = `
    <div class="bookmark" data-id="${bookmark.id}">
      <h2 class="collapsible">&#9660 ${bookmark.title}</h2>
      <a href="${bookmark.url}"><p class="link">${bookmark.url}</p></a>
      <p class="description">${bookmark.desc}</p>
      ${rating}
      <button class="edit">Edit</button>
      <button class="delete">Delete</button>
    </div>
    `;
    if (bookmark.editing) {
      const editRating = generateEditRatingHTML(bookmark.rating);
      expanded = `
        <div class="bookmark" data-id="${bookmark.id}">
          <form>
            <p class="bookmark-title">Title: <input type ="text" value="${
              bookmark.title
            }"></p>
            <p class="bookmark-url">URL: <input type="url" value="${
              bookmark.url
            }"></p>
            <p class="bookmark-description">Description: <input type="text-field" value="${
              bookmark.desc
            }"></p>
            <p class="bookmark-rating">Rating: 
              ${editRating}
          <button class="cancel">Cancel</button>
          <button class="submit">Submit</button>
        </div>
        `;
    }

    return expanded;
  };

  const generatePagination = function() {
    let paginationHTML = '';
    if (store.page !== 1) {
      paginationHTML = paginationHTML + '<button class="prev-page">Previous Page</button>\n';
    }
    paginationHTML = paginationHTML + `Page: ${store.page}\n`;
    if (store.bookmarks.length > store.page * 8) {
      paginationHTML = paginationHTML + '<button class="next-page">Next Page</button>';
    }
    return paginationHTML;
  };

  return {
    render,
    bindEventListeners
  };
})();
