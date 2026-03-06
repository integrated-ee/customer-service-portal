page 50204 "Customer Email Mapping API"
{
    APIPublisher = 'integrated';
    APIGroup = 'customerService';
    APIVersion = 'v1.0';
    EntityName = 'customerEmailMapping';
    EntitySetName = 'customerEmailMappings';
    PageType = API;
    SourceTable = "Customer Email Mapping";
    ODataKeyFields = SystemId;
    DelayedInsert = true;

    layout
    {
        area(Content)
        {
            repeater(GroupName)
            {
                field(systemId; Rec.SystemId) { Caption = 'System ID'; }
                field(email; Rec."Email") { Caption = 'Email'; }
                field(customerNo; Rec."Customer No.") { Caption = 'Customer No.'; }
                field(matchType; Rec."Match Type") { Caption = 'Match Type'; }
            }
        }
    }
}
