codeunit 50201 "Customer Service Install"
{
    Subtype = Install;

    trigger OnInstallAppPerCompany()
    var
        SupportTicketMgt: Codeunit "Support Ticket Mgt.";
    begin
        SupportTicketMgt.InitSetup();
    end;
}
