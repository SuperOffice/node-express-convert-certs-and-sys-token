$(function() {
    var max_fields = 10;
    var wrapper = $(".headerContainer");
    var add_button = $(".add_form_field");

    var x = 1;
    $(add_button).on("click", function(e) {
        e.preventDefault();
        if (x < max_fields) {
            x++;
            $(wrapper).append('<div class="row"><div class="col-md-4"><input type="text" name="Headers" class="form-control" /></div><div class="col-md-4"><input type="text" name="Headers" class="form-control" /></div><a href="#" class="delete">Delete</a></div>'); //add input box
        } else {
            alert('You Reached the limits')
        }
    });

    $(wrapper).on("click", ".delete", function(e) {
        e.preventDefault();
        $(this).parent('div').remove();
        x--;
    })
});