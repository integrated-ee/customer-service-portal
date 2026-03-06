page 50201 "Ticket Comments API"
{
    APIPublisher = 'integrated';
    APIGroup = 'customerService';
    APIVersion = 'v1.0';
    EntityName = 'ticketComment';
    EntitySetName = 'ticketComments';
    PageType = API;
    SourceTable = "Ticket Comment";
    ODataKeyFields = SystemId;
    DelayedInsert = true;

    layout
    {
        area(Content)
        {
            repeater(GroupName)
            {
                field(systemId; Rec.SystemId) { Caption = 'System ID'; }
                field(ticketNo; Rec."Ticket No.") { Caption = 'Ticket No.'; }
                field(lineNo; Rec."Line No.") { Caption = 'Line No.'; }
                field(comment; Rec.Comment) { Caption = 'Comment'; }
                field(authorEmail; Rec."Author Email") { Caption = 'Author Email'; }
                field(authorType; Rec."Author Type") { Caption = 'Author Type'; }
                field(createdAt; Rec."Created At") { Caption = 'Created At'; }
            }
        }
    }
}
