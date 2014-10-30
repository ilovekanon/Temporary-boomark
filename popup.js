var bookmarks = [];
var now = Math.round(new Date().getTime()/1000.0);
var settings = {};

var bangBookmark = {
  init : function() {
    var that = this;
    // Load list
    settings = {};
    var bang_bookmark_list = localStorage.getItem('bang_bookmark_list');
    var bang_bookmark_setting = localStorage.getItem('bang_bookmark_setting');

    if(typeof(bang_bookmark_setting) != 'undefined' 
      && bang_bookmark_setting != null
      && bang_bookmark_setting != 'null'){
      settings = JSON.parse(bang_bookmark_setting);
    }

    if(typeof(settings.expireDay) == 'undefined'
      || settings.expireDay == null 
      || settings.expireDay == 'null'
      || settings.expireDay == ''){
      settings.expireDay = 7;
    } 

    $("#bang_schedule_input").val(settings.expireDay);

    if(typeof(bang_bookmark_list) == 'undefined' 
      || bang_bookmark_list == null 
      || bang_bookmark_list == 'null'
      || bang_bookmark_list == ''){
      bookmarks = [];
    }else{
      var preBookmarks = JSON.parse(bang_bookmark_list);
      preBookmarkLength = preBookmarks.length;

      for(var i=0; i<preBookmarkLength; i++){
        if(preBookmarks[i].expire > now){
          bookmarks.push(preBookmarks[i]);
          that.addView(preBookmarks[i]);
        }
      }
    }
  },

  addView : function(obj) {
    var remainDay = parseInt((obj.expire-now) / 86400);
    var list = "<li id='bang_list_"+obj.id+"'>"
        list += "<div class='bang_float_left'><img src='"+obj.favIconUrl+"' class='bang_favIcon' title='"+remainDay+" day remains'/></div>";
        list += "<div class='bang_float_left bang_title_area'><a href='javascript:;' data-id='"+obj.url+"' class='bang_link_title' title='"+obj.fullTitle+"' tabindex='-1'>"+obj.title+"</a></div>";
        list += "<div class='bang_float_right bang_remove_btn_wrap'>";
        list += "<img src='delete_icon.png' title='Remove' alt='Remove' class='bang_delete_icon' data-id='"+obj.id+"'/>";
        list += "<span class='remain_day' title='"+remainDay+" day remains'>"+remainDay+"</span>";
        list += "</div>";
        list += "<br class='bang_clear' /></li>";
        $("#bang_bookmark_list").append(list);

    $("#bang_bookmark_list").scrollTop($("#bang_bookmark_list").innerHeight());
  },

  addToList : function() {
    var that = this;
    chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
      var tab = arrayOfTabs[0];

      var title;
      var titleLimit = 40;
      if(tab.title.length > titleLimit){
        title = tab.title.substring(0,titleLimit)+'...';
      }else{
        title = tab.title;
      }
      var fullTitle = tab.title;

      var now = Math.round(new Date().getTime()/1000.0);
      var listId = now+Math.floor((1 + Math.random()) * 0x10000).toString(16);

      var favIconUrl;
      if(typeof(tab.favIconUrl) == 'undefined' || !tab.favIconUrl){
        favIconUrl = 'https://www.google.com/images/icons/product/chrome-32.png';
      }else{
        favIconUrl = tab.favIconUrl;
      }

      that.checkDuplicatedUrl(tab.url);
      
      var expire = now+(60*60*24*settings.expireDay); //7days
      //var expire = now+60;
      var info = {
        id : listId,
        url : tab.url,
        title : title,
        fullTitle : fullTitle,
        favIconUrl : favIconUrl,
        updated : now,
        expire : expire
      }

      bookmarks.push(info);
      that.addView(info);
      that.commit();

    });
  },

  checkDuplicatedUrl : function(url){
    bookmarkLength = bookmarks.length;
    for(var i=0; i<bookmarkLength; i++){
      if(bookmarks[i].url == url){
        $('#bang_list_'+bookmarks[i].id).fadeOut('fast');
        bookmarks.splice(i, 1);
        break;
      }
    }
  },

  removeFromList : function(obj) {
    var listId = $(obj.target).attr('data-id');

    bookmarkLength = bookmarks.length;
    for(var i=0; i<bookmarkLength; i++){
      if(bookmarks[i].id == listId){
        bookmarks.splice(i, 1);
        break;
      }
    }
    $('#bang_list_'+listId).fadeOut('fast');
    this.commit();
  },

  commit : function() {
    bookmarks = bookmarks.filter(function(n){ return n != undefined });
    bookmarks.sort(function(a, b) {
       if (a.expire < b.expire)
         return -1;
      if (a.expire > b.expire)
        return 1;
      return 0;
    });
    localStorage.setItem('bang_bookmark_list', JSON.stringify(bookmarks));
    localStorage.setItem('bang_bookmark_setting', JSON.stringify(settings));
  },

  movetoSetting : function() {
    var moveto;
    if(parseInt($('#bang_body_wrap').css('margin-left')) == 0){
      moveto = '-350px';
      $("#bang_setting_notice_wrap").hide();
      $("#bang_bookmark_list").css('max-height', '100px');
      
      //$("#bang_seetingBtn").text(chrome.i18n.getMessage("listBtn"));
      $("#bang_seetingBtn").attr('src', '/images/list_white.png');
      
      $("#bang_addBtn").hide();
      $("#bang_saveSettingBtn").show();
    }else{
      moveto = '0px';
      $("#bang_bookmark_list").css('max-height', '350px');
      
      //$("#bang_seetingBtn").text(chrome.i18n.getMessage("settingBtn"));
      $("#bang_seetingBtn").attr('src', '/images/setting_white.png');
      
      $("#bang_saveSettingBtn").hide();
      $("#bang_addBtn").show();
    }
    $('#bang_body_wrap').animate({
      marginLeft: moveto
    }, 200);
  },

  setSetting : function() {
    var dayValue = $("#bang_schedule_input").val();
    $("#bang_setting_notice_wrap").hide();
    if(!dayValue){
      $("#bang_setting_notice_wrap").removeClass('bang_notice').addClass('bang_error').text('Invaild value you input.').show();
      $("#bang_schedule_input").val(settings.expireDay);
      return false;
    }
    if(dayValue < 1 || dayValue > 14){
      $("#bang_setting_notice_wrap").removeClass('bang_notice').addClass('bang_error').text('Please type in between 1 and 14.').show();
      $("#bang_schedule_input").val(settings.expireDay);
      return false;
    }
    if(settings.expireDay != dayValue){
      settings.expireDay = dayValue;
      this.commit();  
    }

    $("#bang_setting_notice_wrap").removeClass('bang_error').addClass('bang_notice').text('Setting has been saved.').show();
  },

  openTab : function(obj) {
    var url = $(obj.target).attr('data-id');
    chrome.tabs.create({ url: url });
  },

  localizeHtmlPage : function(){
      //Localize by replacing __MSG_***__ meta tags
      var objects = document.getElementsByTagName('html');
      for (var j = 0; j < objects.length; j++)
      {
          var obj = objects[j];

          var valStrH = obj.innerHTML.toString();
          var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1)
          {
              return v1 ? chrome.i18n.getMessage(v1) : "";
          });

          if(valNewH != valStrH)
          {
              obj.innerHTML = valNewH;
          }
      }
  }
};

// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
  bangBookmark.localizeHtmlPage();
  bangBookmark.init();

  $('#bang_addBtn').on('click', function () {
    bangBookmark.addToList();
  });

  $('#bang_seetingBtn').on('click', function () {
    bangBookmark.movetoSetting();
  });

  $(document).on('click', '#bang_saveSettingBtn', function() {
    bangBookmark.setSetting();
  });

  $(document).on('change', '#bang_schedule_input', function() {
    bangBookmark.setSetting();
  });

  $(document).on('click','.bang_delete_icon', function (obj) {
    bangBookmark.removeFromList(obj);
  });

  $(document).on('click','.bang_link_title', function (obj) {
    bangBookmark.openTab(obj);
  });

});

window.addEventListener("unload", function() {
  bangBookmark.commit();
}, false);



