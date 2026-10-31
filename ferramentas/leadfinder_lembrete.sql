-- ============================================================
-- Soft Communication · lembrete diário da prospecção por e-mail
-- Todo dia às 8h de Brasília (11:00 UTC) o banco chama a função leadfinder/resumo,
-- que manda para os membros os retornos do dia e os leads quentes.
-- Antes: secrets RESEND_API_KEY e LEADFINDER_CRON_SECRET na função (ver LEADFINDER.md).
-- Troque SEGREDO_AQUI pelo MESMO valor do secret LEADFINDER_CRON_SECRET.
-- Seguro para rodar de novo.
-- ============================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- O segredo fica no Vault do Supabase (criptografado), nunca no texto da tarefa.
do $$ begin
  if exists (select 1 from vault.secrets where name = 'leadfinder_cron_secret') then
    perform vault.update_secret((select id from vault.secrets where name = 'leadfinder_cron_secret'), 'SEGREDO_AQUI');
  else
    perform vault.create_secret('SEGREDO_AQUI', 'leadfinder_cron_secret');
  end if;
end $$;

-- Recria a tarefa (para mudar o horário, troque '0 11 * * *': minuto, hora UTC, dia, mês, dia da semana)
select cron.unschedule(jobid) from cron.job where jobname = 'leadfinder-resumo';
select cron.schedule('leadfinder-resumo', '0 11 * * *', $job$
  select net.http_post(
    url := 'https://xvabghgvrhpnyywpmodb.supabase.co/functions/v1/leadfinder/resumo',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'leadfinder_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$job$);

-- Para conferir: select * from cron.job_run_details order by start_time desc limit 5;
-- Para desligar: select cron.unschedule(jobid) from cron.job where jobname = 'leadfinder-resumo';
