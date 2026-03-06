page 50202 "Ticket Attachments API"
{
    APIPublisher = 'integrated';
    APIGroup = 'customerService';
    APIVersion = 'v1.0';
    EntityName = 'ticketAttachment';
    EntitySetName = 'ticketAttachments';
    PageType = API;
    SourceTable = "Ticket Attachment";
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
                field(fileName; Rec."File Name") { Caption = 'File Name'; }
                field(blobURL; Rec."Blob URL") { Caption = 'Blob URL'; }
                field(contentType; Rec."Content Type") { Caption = 'Content Type'; }
                field(uploadedAt; Rec."Uploaded At") { Caption = 'Uploaded At'; }
                field(uploadedBy; Rec."Uploaded By") { Caption = 'Uploaded By'; }
            }
        }
    }
}
