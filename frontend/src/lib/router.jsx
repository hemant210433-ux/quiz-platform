'use client';
/**
 * Small compatibility layer so the existing pages (written for react-router)
 * run unchanged on the Next.js App Router. Same URLs, same behaviour.
 */
import NextLink from 'next/link';
import { useParams as useNextParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export function Link({ to, href, ...rest }) {
  return <NextLink href={to ?? href} {...rest} />;
}

export function NavLink({ to, end, className, children, ...rest }) {
  const pathname = usePathname() || '';
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const cls = typeof className === 'function' ? className({ isActive }) : className;
  return (
    <NextLink href={to} className={cls} aria-current={isActive ? 'page' : undefined} {...rest}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </NextLink>
  );
}

// Must be referentially stable (like react-router's navigate): pages put it in effect dependency
// lists, and an unstable function made the quiz page reload its attempt on every render.
export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to, opts = {}) => {
      if (typeof to === 'number') return router.back();
      return opts.replace ? router.replace(to) : router.push(to);
    },
    [router],
  );
}

export function useParams() {
  return useNextParams() || {};
}

export function useLocation() {
  return { pathname: usePathname() || '/' };
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [to, replace, router]);
  return null;
}
