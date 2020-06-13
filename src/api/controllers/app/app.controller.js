let API = process.env.APP_DOMAIN;
if (process.env.API_DEV) {
  API = process.env.API_DEV;
}

exports.app = async (req, res, next) => {
  try {
    let appUrlWs = process.env.APP_DOMAINNAMEWS;
    const {
      theme: themeFromUrl,
      style: styleFromUrl,
      devurl = process.env.API_DEV,
      clapp = '',
      u,
      g,
    } = req.query;
    let theme = 'blue';
    if (themeFromUrl) theme = themeFromUrl;

    let style = '';
    let position = '';
    if (styleFromUrl) style = styleFromUrl;
    let appUrl = `${API}/apps/`;
    if (devurl) {
      appUrl = devurl;
    }
    if (clapp) appUrl += `${clapp}/`;
    let srcPost = `?`;
    const js = `var request = new XMLHttpRequest();
    window.__arsfChatUrl = '${appUrlWs}'
    window.__arsfChatIdg = '${g || ''}'
    window.__arsfChatIdu = '${u || ''}'
    var theme = '${theme}';
    var srcPost = '${srcPost ? `${srcPost}&` : ''}v=' + (new Date()).getTime();
    request.open('GET', '${appUrl}index.html' + srcPost, true);request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      var resp = request.responseText;
      var style = '${style}';
      var position = '${position}';
      var styled = location.href.match(/style=[a-z]+/);
      if (styled) style = styled[0].replace(/style=/,'');
      var ch = document.createElement('div');
      ch.setAttribute('id', "apppopupmax");
      document.body.appendChild(ch);
      var srcs = resp.match(/src="(.*?)"|href="(.*?)"/g);
      var cssFound = '';
      for (var i = 0; i < srcs.length; i++) {
        var src = srcs[i].replace(/src=|href=/,'').replace(/"/g,'');
        var isJs = /.js/.test(src);
        var srcSplit = src.split('?v=')
        if(src[0]==="/") src = '${appUrl}'+src;
        var tagn = isJs ? 'script' : 'link';
        if (!src) continue;
        if(isJs) {
        var tag = document.createElement('script');
        tag.src = src+srcPost;
        document.getElementsByTagName("head")[0].appendChild(tag);
        }
      }
      if(cssFound){
      cssFound = '${appUrl}'+cssFound;
      var tag = document.createElement('link');
        tag.href = cssFound+srcPost;
        tag.rel = 'stylesheet';
        document.getElementsByTagName("head")[0].appendChild(tag);
      }
    }
    };request.send();`;
    res.set('Content-Type', 'text/javascript');
    res.send(js);
  } catch (error) {
    return next(error);
  }
};
