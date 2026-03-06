codeunit 50200 "Support Ticket Mgt."
{
    procedure InitSetup()
    var
        Setup: Record "Customer Portal Setup";
        NoSeries: Record "No. Series";
        NoSeriesLine: Record "No. Series Line";
    begin
        if not Setup.Get() then begin
            Setup.Init();
            Setup.Insert();
        end;

        if not NoSeries.Get('SUPTKT') then begin
            NoSeries.Init();
            NoSeries.Code := 'SUPTKT';
            NoSeries.Description := 'Support Tickets';
            NoSeries."Default Nos." := true;
            NoSeries.Insert();

            NoSeriesLine.Init();
            NoSeriesLine."Series Code" := 'SUPTKT';
            NoSeriesLine."Starting No." := 'ST-0001';
            NoSeriesLine."Increment-by No." := 1;
            NoSeriesLine."Line No." := 10000;
            NoSeriesLine.Insert();
        end;

        if Setup."Ticket No. Series" = '' then begin
            Setup."Ticket No. Series" := 'SUPTKT';
            Setup.Modify();
        end;
    end;

    procedure GetNextTicketNo(): Code[20]
    var
        Setup: Record "Customer Portal Setup";
        NoSeries: Codeunit "No. Series";
    begin
        Setup.Get();
        Setup.TestField("Ticket No. Series");
        exit(NoSeries.GetNextNo(Setup."Ticket No. Series"));
    end;
}
