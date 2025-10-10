import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components';
import { useLocation } from 'react-router-dom';
import { Fragment } from 'react/jsx-runtime';

export const RouteBreadcrumb = () => {
  const { pathname } = useLocation();

  const chunks = pathname.split('/').filter(Boolean);

  if (chunks.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='/'>Home</BreadcrumbLink>
        </BreadcrumbItem>

        {chunks.map((chunk, i) => (
          <Fragment key={chunk}>
            <BreadcrumbSeparator />
            <BreadcrumbItem className='capitalize'>
              {i + 1 === chunks.length ? (
                <BreadcrumbPage>{chunk}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/${chunk}`}>{chunk}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
