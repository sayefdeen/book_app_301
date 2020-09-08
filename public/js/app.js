// For the Update button in details

$('#updateForm').hide();

$('#updateBtn').click(() => {
  $('#updateForm').toggle();
});

// For the Drop Button

$('#dropbtn').click(() => {
  $('#nav-content a').slideToggle('slow');
});
