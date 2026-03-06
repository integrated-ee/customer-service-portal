page 50200 "Support Tickets API"
{
    APIPublisher = 'integrated';
    APIGroup = 'customerService';
    APIVersion = 'v1.0';
    EntityName = 'supportTicket';
    EntitySetName = 'supportTickets';
    PageType = API;
    SourceTable = "Support Ticket";
    ODataKeyFields = SystemId;
    DelayedInsert = true;

    layout
    {
        area(Content)
        {
            repeater(GroupName)
            {
                field(systemId; Rec.SystemId) { Caption = 'System ID'; }
                field(no; Rec."No.") { Caption = 'No.'; }
                field(customerNo; Rec."Customer No.") { Caption = 'Customer No.'; }
                field(subject; Rec.Subject) { Caption = 'Subject'; }
                field(description; Rec.Description) { Caption = 'Description'; }
                field(status; Rec.Status) { Caption = 'Status'; }
                field(category; Rec.Category) { Caption = 'Category'; }
                field(priority; Rec.Priority) { Caption = 'Priority'; }
                field(createdAt; Rec."Created At") { Caption = 'Created At'; }
                field(createdByEmail; Rec."Created By Email") { Caption = 'Created By Email'; }
                field(resolvedAt; Rec."Resolved At") { Caption = 'Resolved At'; }
                field(assignedTo; Rec."Assigned To") { Caption = 'Assigned To'; }
                field(modifiedAt; Rec."Modified At") { Caption = 'Modified At'; }
            }
            part(ticketComments; "Ticket Comments API")
            {
                EntityName = 'ticketComment';
                EntitySetName = 'ticketComments';
                SubPageLink = "Ticket No." = field("No.");
            }
            part(ticketAttachments; "Ticket Attachments API")
            {
                EntityName = 'ticketAttachment';
                EntitySetName = 'ticketAttachments';
                SubPageLink = "Ticket No." = field("No.");
            }
        }
    }
}
