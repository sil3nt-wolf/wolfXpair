(function () {
  var _b = 'PHN0eWxlPiN3b2xmLWNyZWRpdHtwb3NpdGlvbjpmaXhlZDtib3R0b206MDtsZWZ0OjA7cmlnaHQ6MDtiYWNrZ3JvdW5kOiMxYTFhMmU7Y29sb3I6I2UwZTBlMDt0ZXh0LWFsaWduOmNlbnRlcjtwYWRkaW5nOjZweCAxMHB4O2ZvbnQtc2l6ZToxMnB4O3otaW5kZXg6OTk5OTk7Zm9udC1mYW1pbHk6QXJpYWwsc2Fucy1zZXJpZjtwb2ludGVyLWV2ZW50czpub25lfTwvc3R5bGU+PGRpdiBpZD0id29sZi1jcmVkaXQiPlBvd2VyZWQgYnkgPGI+V09MRiBURUNIPC9iPiAmYnVsbDsgQ3JlYXRlZCBieSA8Yj5TaWxlbnQgV29sZjwvYj48L2Rpdj4=';

  function _inject() {
    if (document.getElementById('wolf-credit')) return;
    var html = atob(_b);
    var container = document.createElement('div');
    container.innerHTML = html;
    while (container.firstChild) {
      document.body.appendChild(container.firstChild);
    }
  }

  function _check() {
    if (!document.getElementById('wolf-credit')) _inject();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _inject);
  } else {
    _inject();
  }

  var _obs = new MutationObserver(_check);

  function _watch() {
    _obs.observe(document.body, { childList: true, subtree: false });
  }

  if (document.body) {
    _watch();
  } else {
    document.addEventListener('DOMContentLoaded', _watch);
  }

  setInterval(_check, 3000);
})();
