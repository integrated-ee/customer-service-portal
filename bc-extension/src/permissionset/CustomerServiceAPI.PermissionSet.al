permissionset 50200 "Customer Service API"
{
    Caption = 'Customer Service API';
    Assignable = true;

    Permissions =
        table "Support Ticket" = X,
        table "Ticket Comment" = X,
        table "Ticket Attachment" = X,
        table "Customer Portal Setup" = X,
        table "Customer Email Mapping" = X,
        tabledata "Support Ticket" = RIMD,
        tabledata "Ticket Comment" = RIMD,
        tabledata "Ticket Attachment" = RIMD,
        tabledata "Customer Portal Setup" = RIMD,
        tabledata "Customer Email Mapping" = RIMD,
        page "Support Tickets API" = X,
        page "Ticket Comments API" = X,
        page "Ticket Attachments API" = X,
        page "Customer Portal Setup API" = X,
        page "Customer Email Mapping API" = X,
        codeunit "Support Ticket Mgt." = X;
}
