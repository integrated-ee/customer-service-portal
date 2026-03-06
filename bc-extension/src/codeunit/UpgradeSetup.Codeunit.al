codeunit 50202 "Customer Service Upgrade"
{
    Subtype = Upgrade;

    trigger OnUpgradePerCompany()
    var
        SupportTicketMgt: Codeunit "Support Ticket Mgt.";
    begin
        SupportTicketMgt.InitSetup();
    end;
}
