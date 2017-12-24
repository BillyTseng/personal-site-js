$(document).ready(function () {
  $('#simple-menu').sidr({
    timing: 'ease-in-out',
    speed: 500
  });
});
$('#close-menu-button').click(function () {
  $.sidr('close', 'sidr');
});
$( window ).resize(function () {
  $.sidr('close', 'sidr');
});
