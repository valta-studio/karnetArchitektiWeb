import { useCallback, useState } from 'react';
import { Badge, Box, Button, Card, Flex, Heading, Stack, Text } from '@sanity/ui';
import { RocketIcon } from '@sanity/icons';

type DeployStatus = 'idle' | 'deploying' | 'success' | 'error';

const BUILD_HOOK = import.meta.env.SANITY_STUDIO_NETLIFY_BUILD_HOOK as
  | string
  | undefined;

/**
 * Nástroj Studia: ruční spuštění produkčního buildu na Netlify přes build hook.
 * URL hooku se čte z env proměnné SANITY_STUDIO_NETLIFY_BUILD_HOOK.
 * Deploy se jinak spouští automaticky webhookem při publikaci obsahu — tohle
 * je záloha pro případ, kdy je potřeba web přestavět ručně.
 */
export function DeployTool() {
  const [status, setStatus] = useState<DeployStatus>('idle');

  const triggerDeploy = useCallback(async () => {
    if (!BUILD_HOOK) return;
    setStatus('deploying');
    try {
      // Build hook je prostý POST; odpověď je kvůli CORS neprůhledná (no-cors),
      // proto úspěch vyhodnocujeme podle toho, že fetch nevyhodí chybu sítě.
      await fetch(BUILD_HOOK, { method: 'POST', mode: 'no-cors' });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  return (
    <Flex align="center" justify="center" height="fill" padding={4}>
      <Card
        padding={4}
        radius={3}
        shadow={1}
        style={{ maxWidth: 480, width: '100%' }}
      >
        <Stack space={4}>
          <Stack space={3}>
            <Heading size={2}>Nasadit web</Heading>
            <Text muted size={1}>
              Spustí produkční build na Netlify a znovu nasadí web s aktuálně
              publikovaným obsahem. Běžně se deploy spouští automaticky při
              publikaci — toto je ruční záloha.
            </Text>
          </Stack>

          {!BUILD_HOOK ? (
            <Card padding={3} radius={2} tone="caution">
              <Text size={1}>
                Není nastavená proměnná{' '}
                <code>SANITY_STUDIO_NETLIFY_BUILD_HOOK</code>. Vlož do ní URL
                build hooku z Netlify (Site settings → Build &amp; deploy →
                Build hooks).
              </Text>
            </Card>
          ) : (
            <Stack space={3}>
              <Button
                icon={RocketIcon}
                text={status === 'deploying' ? 'Spouštím…' : 'Nasadit web'}
                tone="primary"
                onClick={triggerDeploy}
                disabled={status === 'deploying'}
                loading={status === 'deploying'}
              />

              {status === 'success' && (
                <Box>
                  <Badge tone="positive" padding={2}>
                    Build spuštěn — nasazení může trvat několik minut.
                  </Badge>
                </Box>
              )}
              {status === 'error' && (
                <Box>
                  <Badge tone="critical" padding={2}>
                    Nepodařilo se spustit build. Zkontroluj URL build hooku.
                  </Badge>
                </Box>
              )}
            </Stack>
          )}
        </Stack>
      </Card>
    </Flex>
  );
}
