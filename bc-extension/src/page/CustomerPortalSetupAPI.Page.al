page 50203 "Customer Portal Setup API"
{
    APIPublisher = 'integrated';
    APIGroup = 'customerService';
    APIVersion = 'v1.0';
    EntityName = 'customerPortalSetup';
    EntitySetName = 'customerPortalSetup';
    PageType = API;
    SourceTable = "Customer Portal Setup";
    ODataKeyFields = SystemId;
    DelayedInsert = true;

    layout
    {
        area(Content)
        {
            repeater(GroupName)
            {
                field(systemId; Rec.SystemId) { Caption = 'System ID'; }
                field(primaryKey; Rec."Primary Key") { Caption = 'Primary Key'; }
                field(ticketNoSeries; Rec."Ticket No. Series") { Caption = 'Ticket No. Series'; }
                field(notificationEmail; Rec."Notification Email") { Caption = 'Notification Email'; }
            }
        }
    }
}
