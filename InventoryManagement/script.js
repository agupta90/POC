$(document).ready(function () {
    loadLogin();
})

function loadLogin() {
    if (sessionStorage.getItem("session") != "active") {
        tab = '<li><a class="active" href="#login">Login</a></li>';
        $("header>nav>ul").empty().append(tab)
        loginForm =
            "<form id='login' onsubmit='return authenticateUser()'>" +
            "<input id='uname' type='text' placeholder='username' />" +
            "<input id='pwd' type='password' placeholder='password' />" +
            "<input type='submit' value='Login' />" +
            "<input type='reset' value='Cancel' />"
        "</form>";
        $("#container").empty().append(loginForm);
    }
    else {
        loadInventory();
    }
}

function authenticateUser() {
    var loginapigClient = loginapigClientFactory.newClient();

    uname = $('#uname').val();
    pwd = $('#pwd').val();

    var params = {
        'username': uname,
        'password': pwd
    }

    var body = {}
    var additionalParams = {
        headers: {},
        queryParams: {
            'username': uname,
            'password': pwd
        }
    }

    loginapigClient.loginGet(params, body, additionalParams)
        .then(function (result) {
            data = JSON.parse(result.data.body)
            console.log(data);
            if (data.response == 'valid') {
                console.log('navigating to inventory');
                sessionStorage.setItem("session", "active");
                sessionStorage.setItem("role", data.role);
                loadInventory();
            }
        }).catch(function (result) {
            console.log("error");
            sessionStorage.setItem("session", null);
            sessionStorage.setItem("role", null);
        });
    return false;
}

function logoutUser() {
    sessionStorage.setItem("session", null);
    sessionStorage.setItem("role", null);
    loadLogin();
}

function loadInventory() {
    tab = '<li><a class="active" href="#inventory" onClick="activateTab($(this));fetchInventory()">Inventory</a></li><li><a href="#addinventory" onClick="activateTab($(this));addInventoryFields()">Add Inventory</a></li><li><a href="#logout" onClick=logoutUser()>Logout</a></li>';
    $("header>nav>ul").empty().append(tab);
    fetchInventory();
}

function fetchInventory() {
    var inventoryapigClient = inventoryapigClientFactory.newClient();
    var params = { 'action': 'fetchinventory' }

    var body = {}
    var additionalParams = {
        headers: {},
        queryParams: { 'action': 'fetchinventory' }
    }

    inventoryapigClient.inventoryGet(params, body, additionalParams)
        .then(function (result) {
            data = JSON.parse(result.data.body)
            console.log(data);

            var inventories = "";
            for (inventory = 0; inventory < data.response.length; inventory++) {
                var item = "";
                item = item + ('<div>' + data.response[inventory].productid + '</div>');
                item = item + ('<div>' + data.response[inventory].productname + '</div>');
                item = item + ('<div>' + data.response[inventory].vendor + '</div>');
                item = item + ('<div>' + data.response[inventory].mrp + '</div>');
                item = item + ('<div>' + data.response[inventory].quantity + '</div>');
                item = item + ('<div>' + data.response[inventory].batchnumber + '</div>');
                item = item + ('<div>' + data.response[inventory].batchdate + '</div>');
                item = item + ('<div>' + data.response[inventory].status + '</div>');
                if (sessionStorage.getItem("role") == 'storemanager') {
                    if (data.response[inventory].status == 'pending') {
                        item = item + ('<button value=' + data.response[inventory].productid + ' onclick="approveInventory($(this).val())">Approve</button>');
                    }
                    else {
                        item = item + ('<div>No Action Needed</div>');
                    }
                }
                else {
                    if (data.response[inventory].status == 'pending') {
                        item = item + ('<div>Approval Requested</div>');
                    }
                    else if (data.response[inventory].status == 'approved') {
                        item = item + ('<div>Approval Granted</div>');
                    }
                }
                inventories = inventories + (item);
            }
            $("#container").css({ 'display': 'grid', 'grid-template-columns': 'repeat(9, 1fr)', 'margin': '1em' });
            $("#container").empty().append(inventories)
        }).catch(function (result) {
            console.log("error");
        });
}

function approveInventory(productid) {
    var inventoryapigClient = inventoryapigClientFactory.newClient();

    var params = { 'action': 'approveinventory' }

    var body = {
        "productid": productid,
        "status": 'approved'
    }
    var additionalParams = {
        headers: {},
        queryParams: { 'action': 'approveinventory' }
    }

    inventoryapigClient.inventoryPut(params, body, additionalParams)
        .then(function (result) {
            data = JSON.parse(result.data.body)
            console.log(data);
            fetchInventory();
        }).catch(function (result) {
            console.log("error");
        });
}

function addInventoryFields(element) {
    $("#container").css({ 'display': 'block', 'margin': '1em' });

    $("#container").empty().append("<div><input id='productname' type='text' placeholder='product name' /></div>" +
        "<div><input id='vendor' type='text' placeholder='vendor' /></div>" +
        "<div><input id='mrp' type='text' placeholder='mrp' /></div>" +
        "<div><input id='batchnumber' type='text' placeholder='batchnumber' /></div>" +
        "<div><input id='batchdate' type='text' placeholder='batchdate' /></div>" +
        "<div><input id='quantity' type='text' placeholder='quantity' /></div>" +
        "<div><button onclick='addInventory()'> ADD </button></div>");
}

function addInventory() {
    var productname = $("#productname").val();
    var vendor = $("#vendor").val();
    var mrp = $("#mrp").val();
    var batchnumber = $("#batchnumber").val();
    var batchdate = $("#batchdate").val();
    var quantity = $("#quantity").val();
    var status = "";
    if (sessionStorage.getItem("role") == "storemanager")
        status = "approved";
    else
        status = "pending";

    var inventoryapigClient = inventoryapigClientFactory.newClient();

    var params = { 'action': 'addinventory' }

    var body = {
        "productname": productname,
        "vendor": vendor,
        "mrp": mrp,
        "batchnumber": batchnumber,
        "batchdate": batchdate,
        "quantity": quantity,
        "status": status
    }
    var additionalParams = {
        headers: {},
        queryParams: { 'action': 'addinventory' }
    }

    inventoryapigClient.inventoryPost(params, body, additionalParams)
        .then(function (result) {
            data = JSON.parse(result.data.body)
            console.log(data);
            activateTab($('a[href^="#inventory"]'));
            fetchInventory();
        }).catch(function (result) {
            console.log("error");
        });
}

function activateTab(element) {
    $(element).parent().siblings().children().removeClass('active');
    $(element).addClass('active');
}

Object.prototype.isEmpty = function () {
    for (var key in this) {
        if (this.hasOwnProperty(key))
            return false;
    }
    return true;
}