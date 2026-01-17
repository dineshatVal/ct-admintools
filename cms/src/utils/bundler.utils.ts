import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { string as rollupString } from 'rollup-plugin-string';
import { writeFile, mkdir, mkdtemp } from 'fs/promises';
import path from 'path';
import { logger } from './logger.utils';

interface CodeFile {
  filename: string;
  content: string;
}

/**
 * Bundles TypeScript files into a single JavaScript file
 *
 * @param codeFiles Array of code files with filenames and content
 * @param key Component key for naming
 * @returns A promise that resolves to the bundled JavaScript code
 */
export async function bundleCode(
  codeFiles: CodeFile[],
  key: string
): Promise<string> {
  // Create project-based temp directory path
  const projectTempPath = path.join(process.cwd(), 'temp');

  // Ensure the temp directory exists
  await mkdir(projectTempPath, { recursive: true });

  // Create a temporary directory for our files
  const tempDir = await mkdtemp(path.join(projectTempPath, `bundler-${key}-`));

  // Set up file paths
  const entryFile = codeFiles.find(
    (file) => file.filename === 'index.ts' || file.filename.includes('main.ts')
  );

  if (!entryFile) {
    throw new Error('No entry file found. Expected index.ts or main.ts');
  }

  // Write all files to the temporary directory
  await Promise.all(
    codeFiles.map(async (file) => {
      const filePath = path.join(tempDir, file.filename);
      const dir = path.dirname(filePath);
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, file.content);
    })
  );

  try {
    // Configure Rollup
    const bundle = await rollup({
      input: path.join(tempDir, entryFile.filename),
      plugins: [
        resolve(),
        typescript({
          tsconfig: path.join(tempDir, 'tsconfig.json'),
          compilerOptions: {
            module: 'ESNext',
            target: 'es6',
            moduleResolution: 'node',
            experimentalDecorators: true,
          },
        }),
        rollupString({
          include: '**/*.html',
        }),
        commonjs(),
      ],
    });

    // Generate bundle
    const { output } = await bundle.generate({
      format: 'es',
      esModule: true,
      name: key,
    });

    await bundle.close();

    // Return the bundled code as string
    return output[0].code;
  } catch (error) {
    logger.error('Bundling error:', error);
    throw error;
  }
}
