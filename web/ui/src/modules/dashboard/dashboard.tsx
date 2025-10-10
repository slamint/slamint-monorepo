import { Button, ButtonSize, ButtonVariant } from '@/components';

export const Dashboard = () => {
  return (
    <>
      <div className='grid grid-cols-6 gap-4 m-4'>
        <h1 className='col-span-12 text-2xl font-bold'>Default</h1>
        <Button>Default</Button>
        <Button variant={ButtonVariant.DESTRUCTIVE}>Danger</Button>
        <Button variant={ButtonVariant.GHOST}>Ghost</Button>
        <Button variant={ButtonVariant.LINK}>Link</Button>
        <Button variant={ButtonVariant.OUTLINE}>Outline</Button>
        <Button variant={ButtonVariant.SECONDARY}>Secondary</Button>
      </div>
      <div className='grid grid-cols-6 gap-4 m-4'>
        <h1 className='col-span-12 text-2xl font-bold'>Large</h1>
        <Button size={ButtonSize.LG}>Default</Button>
        <Button variant={ButtonVariant.DESTRUCTIVE} size={ButtonSize.LG}>
          Danger
        </Button>
        <Button variant={ButtonVariant.GHOST} size={ButtonSize.LG}>
          Ghost
        </Button>
        <Button variant={ButtonVariant.LINK} size={ButtonSize.LG}>
          Link
        </Button>
        <Button variant={ButtonVariant.OUTLINE} size={ButtonSize.LG}>
          Outline
        </Button>
        <Button variant={ButtonVariant.SECONDARY} size={ButtonSize.LG}>
          Secondary
        </Button>
      </div>
      <div className='grid grid-cols-6 gap-4 m-4'>
        <h1 className='col-span-12 text-2xl font-bold'>Small</h1>
        <Button size={ButtonSize.SM}>Default</Button>
        <Button variant={ButtonVariant.DESTRUCTIVE} size={ButtonSize.SM}>
          Danger
        </Button>
        <Button variant={ButtonVariant.GHOST} size={ButtonSize.SM}>
          Ghost
        </Button>
        <Button variant={ButtonVariant.LINK} size={ButtonSize.SM}>
          Link
        </Button>
        <Button variant={ButtonVariant.OUTLINE} size={ButtonSize.SM}>
          Outline
        </Button>
        <Button variant={ButtonVariant.SECONDARY} size={ButtonSize.SM}>
          Secondary
        </Button>
      </div>
      <div className='grid grid-cols-6 gap-4 m-4'>
        <h1 className='col-span-12 text-2xl font-bold'>Icon</h1>
        <Button size={ButtonSize.ICON}>A</Button>
        <Button variant={ButtonVariant.DESTRUCTIVE} size={ButtonSize.ICON}>
          A
        </Button>
        <Button variant={ButtonVariant.GHOST} size={ButtonSize.ICON}>
          A
        </Button>
        <Button variant={ButtonVariant.LINK} size={ButtonSize.ICON}>
          A
        </Button>
        <Button variant={ButtonVariant.OUTLINE} size={ButtonSize.ICON}>
          A
        </Button>
        <Button variant={ButtonVariant.SECONDARY} size={ButtonSize.ICON}>
          A
        </Button>
      </div>
    </>
  );
};
